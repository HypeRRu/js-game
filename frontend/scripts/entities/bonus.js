import GameObject from "./game-object.js";

export default class extends GameObject
{
	constructor(game_manager)
	{
		super(game_manager);
		this.class			= "bonus";
		this.texture		= "bonus";
		this.bounding_box	= {
			x: 0, 
			y: 0, 
			w: 1, 
			h: 1
		};
	}
};