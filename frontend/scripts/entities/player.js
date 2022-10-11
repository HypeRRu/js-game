import Entity from "./entity.js";

export default class extends Entity
{
	constructor(game_manager)
	{
		super(game_manager);
		this.class			= "player";
		this.texture		= "player";
		this.bounding_box	= {
			x: 0.325, 
			y: 0.130, 
			w: 0.500, 
			h: 0.600
		};
		this.speed			= 8;
		this.lifetime		= 3;
		this.animation		= this.walk_animation();
	}

	update()
	{
		const res = this.game_manager.managers.get("physics_manager")
			.update(this);
		if (res == "move")
		{
			this.game_manager.managers.get("ai_manager")
				.disturb_with_step(this.pos_x, this.pos_y);
		}
	}

	attack()
	{
		const has_shoot	= super.attack();
		if (has_shoot)
		{
			this.game_manager.managers.get("ai_manager")
				.disturb_with_shoot(this.pos_x, this.pos_y);
		}
	}

	on_touch_entity(entity)
	{
		if (this.destroyed)
			return false;
		if (entity.class === "bonus")
		{
			++this.lifetime;
			entity.destroy();
			return false;
		}
		if (entity.class === "finish")
		{
			entity.destroy();
			return true;
		}
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
		this.game_manager.game_over(false);
		super.destroy();
	}
};