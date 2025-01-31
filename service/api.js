export const fetchPokemon = async (url, signal) => {
    try {
        const responsePokemons = await fetch(url, {signal});
        if (!responsePokemons.ok) throw new Error("Error while fetching");
        const jsonPokemons = await responsePokemons.json();
        return jsonPokemons;
    } catch(err) {
        console.log("Error occured: " + err.message);
    }
}


export const fetchPokemonDetails = async (id) => {
    try {
        const pokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`);
        if (!pokemon.ok) throw new Error("Failed To fetch Pokemon");
        return (await pokemon.json());
    } catch(err) {
        console.log("Error Occurred: " + err.message);
    }
}

export const fetchPokemonMoves = async (moves) => {
    try {   
        const movesResult = [];

        for (let move of moves) {
            const movePokemon = await fetch(move.move.url);
            if (!movePokemon.ok) throw new Error("Error");
            movesResult.push((await movePokemon.json()));
        }

        return movesResult;
    } 
    catch(err)
    {
        console.log("Error Occured: ", + err.message);
    }
};

export const fetchHeldItems = async (heldItems) => {
    try {
        const heldItemsResult = [];
        for (let item of heldItems)
        {
            if (!item.item) continue;
            const itemPokemon = await fetch(item.item.url);
            if (!itemPokemon.ok) throw new Error("Error");
            heldItemsResult.push((await itemPokemon.json()));
        }
        return heldItemsResult;
    } catch(err)
    {
        console.log("Error Occured: " + err.message);
    }
};

export const getEvolutionChain = async (speciesUrl) => {
    try {
        const resEvo = [];
        const species = await fetch(speciesUrl);
        if (!species.ok) throw new Error("Error while Fetching");
        const evolution = await fetch((await species.json()).evolution_chain.url);
        if (!evolution.ok) throw new Error("Error While Fetching");
        let evolutionChain = (await evolution.json()).chain;

        while (true) 
        {   
            let pokemon = await fetch(evolutionChain.species.url);
            if (!pokemon.ok) throw new Error("Error while fetching")
            pokemon = await (await fetch((await pokemon.json()).varieties[0].pokemon.url)).json();
            resEvo.push(pokemon);
            if (evolutionChain.evolves_to.length > 0)
            {
                evolutionChain = evolutionChain.evolves_to[0];
            }else {break}
        }
        return resEvo;
        
    } catch(err) {
        console.log("Error Occured: " + err.message);
    }
};