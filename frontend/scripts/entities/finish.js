import GameObject from "./game-object.js";

export default class extends GameObject
{
	constructor(game_manager)
	{
		super(game_manager);
		this.class			= "finish";
		this.texture		= "finish";
		this.bounding_box	= {
			x: 0, 
			y: 0, 
			w: 1, 
			h: 1
		};
	}

	destroy()
	{
		this.game_manager.game_over(true);
	}
};