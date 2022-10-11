import GameObject from "./game-object.js";

const sprite_manager = {};

export default class extends GameObject
{
	constructor(game_manager)
	{
		super(game_manager);
		this.class			= "projectile";
		this.texture		= "projectile";
		this.bounding_box	= {
			x: 0.400, 
			y: 0.400, 
			w: 0.120, 
			h: 0.120
		};
	}

	update()
	{
		this.game_manager.managers.get("physics_manager")
			.update(this);
	}

	on_touch_entity(entity)
	{
		if (this.destroyed)
			return false;
		if (["enemy", "player", "projectile"].includes(entity.class))
		{
			this.destroy();
			entity.on_touch_entity(this);
			return true;
		}
		return false;
	}

	on_touch_map(block_idx)
	{
		this.destroy();
		return true;
	}

	speed 			= 40;
	rotateable		= true;
};