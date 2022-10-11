import Manager from "./manager.js";

export default class extends Manager
{
	constructor(ctx)
	{
		super();
		this.#bind_controls();
		/* function bindings */
		this.#kde	= this.#on_key_down.bind(this);
		this.#kue	= this.#on_key_up.bind(this);
		this.#mme	= this.#on_mouse_move.bind(this);
		this.#mde	= this.#on_mouse_down.bind(this);
		this.#mue	= this.#on_mouse_up.bind(this);
		/* key events */
		document.body.addEventListener("keydown", this.#kde);
		document.body.addEventListener("keyup", this.#kue);
		/* mouse events */
		ctx.canvas.addEventListener("mousemove", this.#mme);
		document.body.addEventListener("mousedown", this.#mde);
		document.body.addEventListener("mouseup", this.#mue);
	}

	unload(ctx)
	{
		document.body.removeEventListener("keydown", this.#kde);
		document.body.removeEventListener("keyup", this.#kue);
		/* mouse events */
		ctx.canvas.removeEventListener("mousemove", this.#mme);
		document.body.removeEventListener("mousedown", this.#mde);
		document.body.removeEventListener("mouseup", this.#mue);
	}

	#on_key_down(event)
	{
		if (!this.bind.has(event.keyCode))
			return;
		this.action.set(
			this.bind.get(event.keyCode),
			true
		);
	}

	#on_key_up(event)
	{
		if (!this.bind.has(event.keyCode))
			return;
		this.action.set(
			this.bind.get(event.keyCode),
			false
		);
	}

	#on_mouse_move(event)
	{
		this.m_pos.x	= event.offsetX;
		this.m_pos.y	= event.offsetY;
	}

	#on_mouse_down(event)
	{
		this.action.set("attack", true);
	}

	#on_mouse_up(event)
	{
		this.action.set("attack", false);
	}

	#bind_controls()
	{
		this.bind.set(87, "up");	// W
		this.bind.set(65, "left");	// A
		this.bind.set(83, "down");	// S
		this.bind.set(68, "right");	// D
		this.bind.set(32, "attack");// Space
	}

	bind	= new Map();
	action	= new Map();
	m_pos	= {x: 0, y: 0};

	#kde	= null; // key down event function
	#kue	= null; // key up event function
	#mme	= null; // mouse move event function
	#mde	= null; // mouse down event function
	#mue	= null; // mouse up event function
};