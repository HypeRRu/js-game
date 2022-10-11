import Manager	from "./manager.js";
import AStar	from "../helpers/astar.js";

export default class extends Manager
{
	connect_player(player)
	{
		this.#player	= player;
		/* init A* algo */
		this.#astar		= new AStar();
		this.#astar.set_graph(
			this.managers.get("map_manager").map_graph,
			this.managers.get("map_manager").x_count,
			this.managers.get("map_manager").y_count
		);
	}

	connect(entity)
	{
		if (entity.class === "enemy") // accept only enemies
			this.#connected.push(entity);
	}

	disconnect(entity)
	{
		const i	= this.#connected.indexOf(entity);
		if (i > -1)
			this.#connected.splice(i, 1);
	}

	disturb_with_shoot(x, y)
	{
		this.#disturb(x, y, this.shoot_sound_distance * this.#player.size.x);
	}

	disturb_with_step(x, y)
	{
		this.#disturb(x, y, this.step_sound_distance * this.#player.size.x);
	}

	#disturb(x, y, distance)
	{
		for (let entity of this.#connected)
		{
			const dx	= x - entity.pos_x;
			const dy	= y - entity.pos_y;

			if (Math.sqrt(dx * dx + dy * dy) < distance)
				entity.disturbed	= true;
		}
	}

	async update()
	{
		const updates	= [];
		/* update all entities */
		for (let entity of this.#connected)
		{
			if (entity.destroyed)
				this.disconnect(entity);
			else
				updates.push(this.#update_one(entity));
		}
		/* wait for all entitites updated */
		for (let upd of updates)
			await upd;
	}

	async #update_one(entity)
	{
		entity.attacking	= false;
		{
			/* check for shoot possibility */
			const pdx	= this.#player.pos_x - entity.pos_x;
			const pdy	= this.#player.pos_y - entity.pos_y;
			if (
				!this.#player.destroyed &&
				(
					Math.abs(pdx) < entity.size.x ||
					Math.abs(pdy) < entity.size.y
				) &&
				Math.sqrt(pdx * pdx + pdy * pdy) <= 
					this.shooting_distance * this.#player.size.x
			) // entity can shoot in player
			{
				let dx	= 0;
				let dy	= 0;
				if (Math.abs(pdx) > Math.abs(pdy)) // normalizing movement
				{
					dx = pdx > 0 ? 1 : -1;
					dy = pdy / Math.abs(pdx);
				} else
				{
					dx = pdx / Math.abs(pdy);
					dy = pdy > 0 ? 1 : -1;
				}

				entity.path.length	= 0; // only shooting now, no movement
				entity.path.push({
					x: entity.pos_x + dx * entity.size.x,
					y: entity.pos_y + dy * entity.size.y
				});
				entity.attacking	= true;
				return;
			}
			if (
				Math.sqrt(pdx * pdx + pdy * pdy) 
					<= this.view_distance * this.#player.size.x
				&& !entity.disturbed
			) // entity see player
			{
				entity.disturbed	= true;
				entity.path.length	= 0;
			}
		}
		/* if entity already have a path, no need to find new one */
		if (entity.path.length)
			return;
		entity.speed	= 4;
		if (!entity.disturbed)
		{
			/* when entity not disturbed, his movement is randomized */
			/* set random movement */
			const dx	= Math.floor(Math.random() * 2.2 - 0.9);
			const dy	= Math.floor(Math.random() * 2.2 - 0.9);
			entity.path.push({
				x: entity.pos_x + dx * entity.size.x,
				y: entity.pos_y + dy * entity.size.y
			});
			return;
		} else
		{
			/* when entity has been disturbed, he goes to the noise source */
			/* source and destination of entity movement */
			const from	= Math.floor(
					(entity.pos_y + entity.size.y / 2) / entity.size.y
				) * this.managers.get("map_manager").x_count +
				Math.floor(
					(entity.pos_x + entity.size.x / 2) / entity.size.x
				);
			const to	= Math.floor(
					(this.#player.pos_y + this.#player.size.y / 2) / this.#player.size.y
				) * this.managers.get("map_manager").x_count +
				Math.floor(
					(this.#player.pos_x + this.#player.size.x / 2) / this.#player.size.x
				);
			/* finding path with A* algorithm */
			const path	= this.#astar.find_path(from, to);
			entity.path.length	= 0;
			for (let idx of path)
			{
				/* set entity path */
				entity.path.push({
					x: (
						idx % this.managers
							.get("map_manager").x_count
					) * entity.size.x + entity.speed,
					y: Math.floor(
						idx / this.managers
							.get("map_manager").x_count
					) * entity.size.y + entity.speed,
				});
			}
			entity.speed		= 6;
			entity.disturbed	= false;
		}
	}

	shooting_distance		= 4; // distance from wich entity can shoot in player
	view_distance			= 6; // distance from wich entity can see player
	step_sound_distance		= 2; // distance from wich entity can hear player's steps
	shoot_sound_distance	= 8; // distance from wich entity can hear player's shoot

	#player			= null;
	#connected		= [];
	#astar			= null;
};