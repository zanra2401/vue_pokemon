import { createApp, ref, onMounted, onUnmounted, useTemplateRef, watch } from "https://unpkg.com/vue@3.5.13/dist/vue.esm-browser.js";
import { typeColors } from "./global.js";
import { fetchPokemon } from "../service/api.js";

const pageState = {
    LOADED: 'loaded',
    LOADING: 'loading',
    NEWLOAD: 'newloading',
    LOADEDSEARCH: 'loadedsearch',
    SEARCHING: 'searching'
};



const app = createApp({
    setup() {
        const state = ref({
            pageState: pageState.LOADING,
            url: "https://pokeapi.co/api/v2/pokemon/?limit=20",
            filter: {
                type: 'all',
                game: 'all'
            },
            display: 'default',
        });
        const displayPokemons = ref([]);
        const fetchedPokemons = ref([]);
        const scrollPosition = ref(0);
        const loadImageIndex = ref(0);
        const filterStart = ref(0);
        const controller = ref(undefined);
        const searchValue = ref("");

        watch(() => [state.value.filter.type, state.value.filter.game], (newValue, oldValue) => {
            if (newValue[0] == 'all' && newValue[1] == 'all') 
            {
                state.value.display = 'default';
                filterStart.value = 0;
            } else {
                state.value.display = 'filter';
            }
        });

        return {
            state,
            displayPokemons,
            filterStart,
            fetchedPokemons,
            typeColors,
            scrollPosition,
            loadImageIndex,
            searchValue,
        };
    },

    methods: {
        async updateDisplayPokemons()
        {
            if (this.controller) {
                this.controller.abort();
            }
            this.controller = new AbortController();
            const signal = this.controller.signal;

            const displayPokemonsLength = this.displayPokemons.length;
            if (this.fetchedPokemons.length <= this.displayPokemons.length)
            {
                const result = await fetchPokemon(this.state.url, signal);
                const pokemons = await Promise.all(result.results.map(async (element) => {
                    const pokemon = await fetch(element.url, signal);
                    const result = await pokemon.json();
                    return result;
                }));
                this.fetchedPokemons.push(...pokemons);
                this.displayPokemons.push(...pokemons);
                this.state.url = result.next;
            } else {     
                if (this.fetchedPokemons.length - displayPokemonsLength >= 20)
                {
                    this.displayPokemons.push( ...this.fetchedPokemons.slice(displayPokemonsLength, displayPokemonsLength + 20));
                } else {
                    this.displayPokemons.push( ...this.fetchedPokemons.slice(displayPokemonsLength, this.fetchedPokemons.length));
                }
            }

            this.loadImage(displayPokemonsLength);
            this.state.pageState = pageState.LOADED;
        },

        handleElementScroll() {
            this.scrollPosition = window.scrollY;
            

            if (window.innerHeight + this.scrollPosition >= document.body.offsetHeight - 200 && this.state.pageState != pageState.NEWLOAD && this.state.pageState != pageState.LOADEDSEARCH && this.state.pageState != pageState.LOADING && this.state.pageState != pageState.SEARCHING) {
                this.state.pageState = pageState.NEWLOAD;
                switch(this.state.display) {
                    case 'filter':
                        this.updateDisplayPokemonsFiltered();
                        break;
                    default:
                        this.updateDisplayPokemons();
                        break;
                }
            }
        },

        async loadImage(start) 
        {
            for (let i = start; i < this.displayPokemons.length; i++)
            {
                if (!this.displayPokemons[i]) return;
                const promise = new Promise((resolve, reject) => {
                    const pokemon = this.displayPokemons[i];
                    const img = new Image();
                    img.src = pokemon.sprites.front_default;
                    img.classList.add('img');

                    img.onload = () => resolve({
                        id: 'pokemon' + pokemon.id,
                        img
                    });
                    img.onerror = () => reject(new Error("Error Load Image"));
                });
                
                promise.then((pokemon) => {
                    const pokemonImg = document.getElementById(pokemon.id);
                    if (pokemonImg)
                    {
                        pokemonImg.innerHTML = "";
                        pokemonImg.appendChild(pokemon.img);
                    }
                });
            }
        },

        changeTypeFilter(filter)
        {
            this.state.filter.type = filter;
            this.displayPokemons.splice(0, this.displayPokemons.length);
            Array.from(document.getElementsByClassName("filter-tags-type")).forEach(element => {
                if (element.innerText == filter) 
                {
                    element.classList.add('active')
                } else {
                    element.classList.remove('active');
                }
            });
            this.filterStart = 0;
            this.state.pageState = pageState.LOADING;
            if (this.state.filter.type == "all" && this.state.filter.game == "all") return this.updateDisplayPokemons();
            this.updateDisplayPokemonsFiltered();
        },

        changeTypeGame(filter)
        {  
            this.state.filter.game = filter;
            this.displayPokemons.splice(0, this.displayPokemons.length);
            Array.from(document.getElementsByClassName("filter-tags-games")).forEach(element => {
                if (element.innerText == filter) 
                {
                    element.classList.add('active')
                } else {
                    element.classList.remove('active');
                }
            });
            this.filterStart = 0;
            this.state.pageState = pageState.LOADING;
            if (this.state.filter.type == "all" && this.state.filter.game == "all") return this.updateDisplayPokemons();
            this.updateDisplayPokemonsFiltered();
        },

        async updateDisplayPokemonsFiltered()
        {
            if (this.controller) {
                this.controller.abort();
            }
            this.controller = new AbortController();
            const signal = this.controller.signal;

            const displayPokemonLength = this.displayPokemons.length;
            let pokemons = [];

            while (pokemons.length < 20) 
            {
                if (this.filterStart < this.fetchedPokemons.length)
                {
                    const start = this.filterStart;
                    for (let pokemon of this.fetchedPokemons.slice(start, this.fetchedPokemons.length))
                    {
                        if (pokemons.length >= 20) break;
                        let valid = true;
                        if (this.state.filter.type != 'all')
                        {
                            let typeValid = false;

                            for (let type in pokemon.types)
                            {
                                if (pokemon.types[type].type.name == this.state.filter.type)
                                {
                                    typeValid = true;
                                    break;
                                }
                            }
                            if (!typeValid) valid = false;
                        }

                        if (this.state.filter.game != 'all')
                        {
                            let gameValid = false;

                            for (let game in pokemon.game_indices)
                            {
                                if (pokemon.game_indices[game].version.name == this.state.filter.game)
                                {
                                    gameValid = true;
                                    break;
                                }
                            }
                            if (!gameValid) valid = false;
                        }

                        if (valid)
                        {
                            pokemons.push(pokemon);
                        }         
                        this.filterStart += 1; 
                    }
                }
                else if (this.state.url)
                {
                    const result = await fetchPokemon(this.state.url, signal);
                    const pokemonsRes = await Promise.all(result.results.map(async (element) => {
                        const pokemon = await fetch(element.url);
                        const result = await pokemon.json();
                        return result;
                    }));
                    this.fetchedPokemons.push(...pokemonsRes);
                
                    this.state.url = result.next;
                } else {
                    break;
                }
            }
            this.displayPokemons.push(...pokemons);
            this.loadImage(displayPokemonLength);
            this.state.pageState = pageState.LOADED;
        },

        async search() {
            this.state.pageState = pageState.LOADING;
            this.displayPokemons.splice(0, this.displayPokemons.length);
            if (this.searchValue.length < 1)
            {
                if (this.state.display == 'filter')
                {
                    this.filterStart = 0;
                    this.updateDisplayPokemonsFiltered()
                } else {
                    this.updateDisplayPokemons();
                }
                return;
            }
            if (this.controller) {
                this.controller.abort();
            }

            this.controller = new AbortController();
            const signal = this.controller.signal;

            let pokemons = [];
            let searched = 0;

            const reg = new RegExp(`.*${this.searchValue}.*`, 'i');
  
            while (pokemons.length < 20)
            {   
                if (this.fetchedPokemons.length > searched)  {
                    const pokeTemp = this.fetchedPokemons.slice(searched, this.fetchedPokemons.length);
                    for (let pokemon of pokeTemp) 
                    {
                        if (reg.test(pokemon.name)) {
                            pokemons.push(pokemon);
                        }
                        searched += 1;
                    }
                } else if (this.state.url) {
                    const result = await fetchPokemon(this.state.url, signal);
                    if (result) {
                        const pokemonsRes = await Promise.all(result.results.map(async (element) => {
                            const pokemon = await fetch(element.url, signal);
                                const result = await pokemon.json();
                                return result;
                            }));
                        this.fetchedPokemons.push(...pokemonsRes);
                        this.state.url = result.next;
                    } else {
                        return;
                    }
                } else {
                    break;
                }
            } 

            this.displayPokemons.push(...pokemons);
            this.loadImage(0);
            this.state.pageState = pageState.LOADEDSEARCH;
        }
    },
     
    mounted()
    {
        document.addEventListener("scroll", this.handleElementScroll);
        this.updateDisplayPokemons();

    }
});

app.mount("#index");