import { createApp, ref, useTemplateRef, onMounted, onUnmounted } from "../node_modules/vue/dist/vue.esm-browser.js";
import { typeColors } from "./global.js";

const pageState = {
    LOADED : 'loaded',
    LOADING: 'loading',
    NEWLOAD: 'newloading'
};

const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);

const state = ref({
    pageState: pageState.LOADING,
});

const app = createApp({
    data() {
        return {
            state,
            id: params.get('id'),
            typeColors
        };
    },
    methods: {
        fetchPokemon() {
            try {
                fetch(`https://pokeapi.co/api/v2/pokemon/${params.get('id')}/`).then(async (response) => {
                    if (!response.ok || response.status >= 400) throw new Error("Fetching Error");
                    const pokemonFetchResult = await response.json();
                    let pokemon = {
                        name: pokemonFetchResult.name,
                        stats: pokemonFetchResult.stats,
                        form: pokemonFetchResult.held_items,
                        moves: [],
                        cries: pokemonFetchResult.cries,
                        types: pokemonFetchResult.types,
                        height: pokemonFetchResult.height,
                        weight: pokemonFetchResult.weight,
                        id: pokemonFetchResult.id,
                        male_sprites: [],
                        female_sprites: [],
                        shiny_male_sprites: [],
                        shiny_female_sprites: [],
                        held_items: []
                    };
    
                    if (pokemonFetchResult.forms.length > 1)
                    {
                        pokemon.form = pokemonFetchResult.form;
                    }
    
                    for (let keyMove in pokemonFetchResult.moves)
                    {
                        let move = {
                            name: pokemonFetchResult.moves[keyMove].move.name,
                        };

                        await fetch(pokemonFetchResult.moves[keyMove].move.url).then(async response => {
                            if (!response.ok || response.status >= 400) throw new Error("Error Fetching");
                            const resultMoves = await response.json();

                            move.accuracy = resultMoves.accuracy;
                            move.power = resultMoves.power;
                            move.pp = resultMoves.pp;
                            move.priority = resultMoves.priority;
                            move.stat_changes = resultMoves.stat_changes;
                            move.target = resultMoves.target;
                            move.type = resultMoves.type;
                        });

                        pokemon.moves.push(move);
                    }

                    for (let sprite in pokemonFetchResult.sprites)
                    {
                        const male = new RegExp("^(front_|back_)default$", 'i');
                        const female = new RegExp("^(front_|back_)female$", 'i');
                        const shinyMale = new RegExp("^(front_shiny|back_shiny)$", 'i');
                        const shinyFemale = new RegExp("^(front_shiny|back_shiny)_female$", 'i');
                        
                        if (male.test(sprite) && pokemonFetchResult.sprites[sprite] != null)
                        {
                            pokemon.male_sprites.push(pokemonFetchResult.sprites[sprite]);
                        } else if (female.test(sprite) && pokemonFetchResult.sprites[sprite] != null) 
                        {
                            pokemon.female_sprites.push(pokemonFetchResult.sprites[sprite]);
                        } else if (shinyMale.test(sprite) && pokemonFetchResult.sprites[sprite] != null)
                        {
                            pokemon.shiny_male_sprites.push(pokemonFetchResult.sprites[sprite]);
                        } 
                        else if (shinyFemale.test(sprite) && pokemonFetchResult.sprites[sprite] != null)
                        {
                            pokemon.shiny_female_sprites.push(pokemonFetchResult.sprites[sprite]);
                        }
                    }

                    for(let item in pokemonFetchResult.held_items)
                    {
                        await fetch(pokemonFetchResult.held_items[item].item.url).then(async response => {
                            if (!response.ok || response.status >= 400) throw new Error("Error Fetching");
                            const result = await response.json();
                            pokemon.held_items.push({
                                name: result.name,
                                sprite: result.sprites.default
                            });
                        });
                    }
                    
                    this.pokemon = pokemon;
                    this.state.pageState = pageState.LOADED;
                });
            } 
            catch (err)
            {
                console.log("Error Occured: " + err.message);
            }
        },

        next()
        {
            window.location.href = `/pages/pokemonDetail.html?id=${parseInt(this.id) + 1}`;
        },

        prev()
        {
            window.location.href = `/pages/pokemonDetail.html?id=${parseInt(this.id) - 1}`;
        },
        home()
        {
            window.location.href = `/index.html`;
        }
    },
    mounted() 
    {
        this.fetchPokemon();
    }
});

app.mount("#pokemon-detail");