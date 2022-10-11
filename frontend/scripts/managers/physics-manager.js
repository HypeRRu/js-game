import Manager from "./manager.js";

export default class extends Manager
{
	constructor()
	{
		super();
	}

	update(obj)
	{
		// console.log(obj);
		if (obj.move_x === 0 && obj.move_y === 0)
			return "stop";
		/* new position */
		let pos_x		= obj.pos_x + Math.floor(obj.move_x * obj.speed);
		let pos_y		= obj.pos_y + Math.floor(obj.move_y * obj.speed);		
		/* get entity at this position */
		const entity	= this.#get_entity(
			obj, 
			pos_x + obj.bounding_box.x * obj.size.x, 
			pos_y + obj.bounding_box.y * obj.size.y
		);
		/* check entity interaction */
		if (entity && obj.on_touch_entity(entity))
			return "collision";
		/* get wall at this position */
		const is_wall	= this.check_wall(
			pos_x + obj.bounding_box.x * obj.size.x, 
			pos_y + obj.bounding_box.y * obj.size.y,
			obj.bounding_box.w * obj.size.x, 
			obj.bounding_box.h * obj.size.y
		);
		/* check wall collisions */
		if (is_wall && obj.on_touch_map())
			return "wall";
		if (is_wall)
		{
			if (!obj.move_y || !obj.move_x)
				return "wall";
			// check 2 moves probability 
			let	has_move	= false;
			if (
				!this.check_wall(
					obj.pos_x + obj.bounding_box.x * obj.size.x, 
					pos_y + obj.bounding_box.y * obj.size.y,
					obj.bounding_box.w * obj.size.x, 
					obj.bounding_box.h * obj.size.y
				)
			) // try move only y
			{
				has_move		 = true;
				obj.pos_y		 = pos_y;
				obj.view_pos.y	+= Math.floor(obj.move_y * obj.speed);
			}
			if (
				!this.check_wall(
					pos_x + obj.bounding_box.x * obj.size.x, 
					obj.pos_y + obj.bounding_box.y * obj.size.y,
					obj.bounding_box.w * obj.size.x, 
					obj.bounding_box.h * obj.size.y
				)
			) // try move only x
			{
				has_move		 = true;
				obj.pos_x		 = pos_x;
				obj.view_pos.x	+= Math.floor(obj.move_x * obj.speed);
			}
			if (!has_move)
				return "wall";
		} else
		{
			obj.pos_x		 = pos_x;
			obj.pos_y		 = pos_y;
			obj.view_pos.x	+= Math.floor(obj.move_x * obj.speed);
			obj.view_pos.y	+= Math.floor(obj.move_y * obj.speed);
		}
		return "move";
	}

	check_wall(x, y, w, h)
	{
		/* rect corners coords */
		const corners	= [
			[x, y], [x + w, y], [x + w, y + h], [x, y + h]
		];
		const map_manager	= this.managers.get("map_manager");
		for (let corner of corners)
		{
			/* check out of map */
			if (
				corner[0] < 0 || 
				corner[0] >= map_manager.x_count * map_manager.tile_size.x ||
				corner[1] < 0 ||
				corner[1] >= map_manager.y_count * map_manager.tile_size.y
			)
				return true;
			/* check wall */
			if (
				map_manager.get_tileset_idx(corner[0], corner[1]) ===
				map_manager.wall_idx
			)
				return true;
		}
		return false;
	}

	#get_entity(obj, x, y)
	{
		for (let entity of this.managers.get("game_manager").entities)
		{
			if (entity.name == obj.name || entity.destroyed)
				continue;
			const e_x	= entity.pos_x + entity.bounding_box.x * entity.size.x; 	
			const e_y	= entity.pos_y + entity.bounding_box.y * entity.size.y;
			/* check intersection */
			if (
				x	<=	e_x	+ entity.bounding_box.w	* entity.size.x	&&
				e_x	<=	x	+ obj.bounding_box.w	* obj.size.x	&&
				y	<=	e_y	+ entity.bounding_box.h	* entity.size.y	&&
				e_y	<=	y	+ obj.bounding_box.h	* obj.size.y	
     		) 
				return entity;
		}
		return null;
	}
};