export default class
{
	set_graph(graph, w, h)
	{
		this.#graph			= graph;
		this.#graph_size.w	= w; // map width 
		this.#graph_size.h	= h; // map height
	}

	find_path(from, to)
	{
		const path		= [];
		const handled	= [];
		const queue		= [];

		queue.push({
			vertex		: from,
			cost		: 0,
			heuristic	: this.#heuristic(from, to),
			previous	: from,
			priority	: this.#heuristic(from, to)
		}); // push source vertex to queue

		while (queue.length)
		{
			/* pop vertex with min priority */
			let current	= this.#heap_pop_min(queue);
			if (current.vertex == to) // found path
			{
				/* restore the path */
				while (current.vertex != from)
				{
					path.push(current.vertex);
					current = this.#find_by_name(
						handled, 
						current.previous, 
						"vertex"
					);
				}
				path.reverse();
				return path;
			}
			/* a poped vertex is handled now */
			handled.push(current);
			for (let child_vertex of this.#graph.get(current.vertex))
			{
				let child	= this.#find_by_name(
					handled, 
					child_vertex, 
					"vertex"
				); /* searching for child vertex in array of handled */
				const cost	= current.cost + 1;
				if (
					!child ||
					cost < child.cost
				)
				{
					if (!child)
					{
						/* create child vertex */
						child = {
							vertex		: child_vertex,
							cost		: 0,
							heuristic	: this.#heuristic(child_vertex, to),
							previous	: null,
							priority	: this.#heuristic(child_vertex, to)
						};
					}
					/* set new cost and parent vertex, recalc priority */
					child.previous	= current.vertex;
					child.cost		= cost;
					child.priority	= child.cost + child.heuristic;

					handled.push(child);
					if (!this.#find_by_name(queue, child.vertex, "vertex"))
					{
						/* add this vertex to queue */
						this.#heap_push(queue, child);
					}
				}
			}	
		}	
		return [];
	}

	#find_by_name(array, name, field = "name")
	{
		for (let element of array)
		{
			if (element[field] == name)
				return element;
		}
		return null;
	}

	#heapify(heap, index)
	{
		/* restoring heap property for index node */
		const size		= heap.length;

		let smallest	= index;
		const left		= 2 * index + 1;
		const right		= 2 * index + 2;

		if (
			left < size && heap[left].priority < 
			heap[smallest].priority
		)
			smallest	= left;
		if (
			right < size && heap[right].priority < 
			heap[smallest].priority
		)
			smallest	= right;

		if (smallest != index)
		{
			[heap[index], heap[smallest]] = [heap[smallest], heap[index]];
			this.#heapify(heap, smallest);
		}
	}

	#heap_pop_min(heap)
	{
		/* extract node with min priority */
		const min	= heap[0];
		[heap[0], heap[heap.length - 1]] = 
			[heap[heap.length - 1], heap[0]];
		heap.pop();
		this.#heapify(heap, 0);
		return min;
	}

	#heap_push(heap, element)
	{
		/* add node to heap */
		const psize	= heap.length;
		heap.push(element);
		if (psize)
		{
			for (let i = Math.floor((psize + 1) / 2); i >= 0; --i)
				this.#heapify(heap, i);
		}
	}

	#heuristic(from, to)
	{
		const from_x	= from % this.#graph_size.w;
		const from_y	= Math.floor(from / this.#graph_size.w);

		const to_x		= to % this.#graph_size.w;
		const to_y		= Math.floor(to / this.#graph_size.w);
		/* Euclid's distance */
		return Math.sqrt(
			(to_y - from_y) * (to_y - from_y) +
			(to_x - from_x) * (to_x - from_x)
		);
	}

	#graph	= null;
	#graph_size	= {x: 0, y: 0};
};
