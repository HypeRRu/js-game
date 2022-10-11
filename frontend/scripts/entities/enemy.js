import Entity from "./entity.js";

export default class extends Entity
{
	constructor(game_manager)
	{
		super(game_manager);
		this.class			= "enemy";
		this.texture		= "enemy";
		this.bounding_box	= {
			x: 0.325, 
			y: 0.130, 
			w: 0.500, 
			h: 0.600
		};
		this.lifetime		= 1;
		this.animation		= this.walk_animation();
	}

	update()
	{
		this.view_pos.x	= this.pos_x 
			- this.game_manager.managers.get("map_manager").view.x;
		this.view_pos.y	= this.pos_y
			- this.game_manager.managers.get("map_manager").view.y;

		if (this.destroyed || !this.path.length)
			return;
		/* where to walk */
		const dx = this.path[0].x - this.pos_x;
		const dy = this.path[0].y - this.pos_y;
		/* no move */
		if (Math.abs(dx) < this.speed && Math.abs(dy) < this.speed)
		{
			this.pos_x += dx;
			this.pos_y += dy;
			this.path.shift();
			return;
		}
		if (Math.abs(dx) > Math.abs(dy))
		{
			this.move_x = dx > 0 ? 1 : -1;
			this.move_y = dy / Math.abs(dx);
		} else
		{
			this.move_x = dx / Math.abs(dy);
			this.move_y = dy > 0 ? 1 : -1;
		}
		/* update view */
		this.view_pos.x	+= this.move_x;
		this.view_pos.y	+= this.move_y;
		if (this.attacking)
		{
			this.attack();
			return;
		}
		/* update position */
		const prev_x	= this.pos_x;
		const prev_y	= this.pos_y;
		const res		= this.game_manager.managers.get("physics_manager")
			.update(this);
		/* check collisions */
		if (
			(
				res === "move" &&
				Math.abs(this.pos_x - this.path[0].x) < this.speed &&
				Math.abs(this.pos_y - this.path[0].y) < this.speed
			) ||
			(
				Math.abs(this.pos_x - prev_x) < this.speed / 16 &&
				Math.abs(this.pos_y - prev_y) < this.speed / 16
			)
		)
		{
			this.path.shift();
		}
	}

	on_touch_entity(entity)
	{
		if (this.destroyed)
			return false;
		if (entity.class === "projectile")
		{
			if (!--this.lifetime)
				this.destroy();
			entity.destroy();
			return true;
		}
		return false;
	}

	destroy()
	{
		this.game_manager.managers.get("sound_manager")
			.play_on(
				"dead.ogg", 
				this.pos_x, this.pos_y, 
				{volume: 0.2}
			);
		this.game_manager.managers.get("ai_manager")
			.disconnect(this);

		this.class		= "enemy-dead";
		this.texture	= "enemy-dead";
		this.destroyed	= true;

		this.game_manager.score	+= 1000;
		this.move_x		= this.move_y = 0;
		this.attacking	= false;
	}

	path			= [];
	attacking		= false;
	disturbed		= false;
};