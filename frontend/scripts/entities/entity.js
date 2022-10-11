import GameObject from "./game-object.js";

export default class extends GameObject
{
	lifetime		= 3;
	speed			= 4;
	_can_shoot		= true;
	rotateable		= true;

	walk_animation()
	{
		return setInterval(
			() => {
				if (this.destroyed || (this.move_x == 0 && this.move_y == 0))
					return;
				this.texture = this.class + "-walk";
				this.game_manager.managers.get("sound_manager")
					.play_on(
						"steps.ogg", 
						this.pos_x, this.pos_y, 
						{volume: 0.3}
					);
				setTimeout(() => this.texture = this.class, 250);
			}, 500
		);
	}

	shoot_animation()
	{
		this.texture = this.class + "-shoot";
		this.game_manager.managers.get("sound_manager")
			.play_on(
				"fire.ogg", 
				this.pos_x, this.pos_y, 
				{volume: 0.3}
			);
		setTimeout(() => this.texture = this.class, 300);
	}

	_wait_for_shoot()
	{
		setTimeout(() => this._can_shoot = true, 500);
	}

	attack()
	{
		if (!this._can_shoot)
			return false;
		this.shoot_animation();
		this._can_shoot	= false;
		this._wait_for_shoot();
		/* create projectile object */
		const projectile	= this.game_manager.create("projectile");
		/* set object size */
		projectile.size		= {x: 64, y: 64};
		projectile.name		= "projectile" + 
			(++this.game_manager.attack_count);
		/* set movement direction */
		{
			const view_x	= this.pos_x - 
				this.game_manager.managers.get("map_manager").view.x;
			const view_y	= this.pos_y - 
				this.game_manager.managers.get("map_manager").view.y;
			const dx		= this.view_pos.x - view_x;
			const dy		= this.view_pos.y - view_y;

			if (Math.abs(dx) > Math.abs(dy))
			{
				projectile.move_x	= dx > 0 ? 1 : -1;
				projectile.move_y	= dy / Math.abs(dx);
			} else
			{
				projectile.move_x	= dx / Math.abs(dy);
				projectile.move_y	= dy > 0 ? 1 : -1;
			}
		}
		/* spawn point */
		projectile.pos_x 		= this.pos_x + projectile.move_x * 0.6 * this.size.x;
		projectile.pos_y 		= this.pos_y + projectile.move_y * 0.6 * this.size.y;
		projectile.view_pos.x	= this.view_pos.x;
		projectile.view_pos.y	= this.view_pos.y;

		if (
			!this.game_manager.managers
				.get("physics_manager").check_wall(
					projectile.pos_x + 
						projectile.bounding_box.x * projectile.size.x, 
					projectile.pos_y + 
						projectile.bounding_box.y * projectile.size.y,
					projectile.bounding_box.w * projectile.size.x, 
					projectile.bounding_box.h * projectile.size.y
				)
		) // wall checking, no need to spawn projectile inside wall
			this.game_manager.entities.push(projectile);
		return true;
	}
};