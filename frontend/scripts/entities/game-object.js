export default class
{
	constructor(game_manager)
	{
		this.game_manager = game_manager;
	}

	async draw(ctx)
	{
		if (!ctx)
			return;

		const view_x	= this.rotateable ? 
			this.view_pos.x : 
			this.pos_x - this.game_manager.managers
				.get("map_manager").view.x;
		const view_y	= this.rotateable ? 
			this.view_pos.y : 
			this.pos_y - this.game_manager.managers
				.get("map_manager").view.y;

		return this.game_manager.managers.get("sprite_manager")
			.draw_sprite( // draw sprite
				ctx,
				this.texture,
				this.pos_x, this.pos_y,
				view_x, 
				view_y,
			);
	}

	on_touch_entity(entity)
	{
		return false;
	}

	on_touch_map()
	{
		return false;
	}

	destroy()
	{
		this.destroyed	= true;
		this.game_manager.destroy(this);
	}

	pos_x			= 0;
	pos_y			= 0;
	size			= {x: 0, y: 0};

	move_x			= 0;
	move_y			= 0;
	view_pos		= {x: 0, y: 0};
	rotateable		= false;

	name			= null;
	class			= null;
	texture			= null;
	game_manager	= null;

	bounding_box	= {x: 0, y: 0, w: 0, h: 0};

	destroyed		= false;
	animation		= null;
};