import { createApp, ref, onMounted, onUnmounted, useTemplateRef } from "../node_modules/vue/dist/vue.esm-browser.js";
import { typeColors } from "./global.js";

const pageState = {
    LOADED : 'loaded',
    LOADING: 'loading',
    NEWLOAD: 'newloading',
    LOADEDSEARCH: 'loadedsearch',
    SEARCHING: 'searching'
};



const state = ref({
    pageState: pageState.LOADING,
    url: "https://pokeapi.co/api/v2/pokemon/?limit=20",
    filter: {
        type: 'all',
        game: 'all'
    }
});




const app = createApp({
    data() {
        return {
            state,
            pokemons : [],
            typeColors: typeColors,
            scrollPosition: 0,
            loadImageIndex: 0
        }
    },
    methods: {
       async fetchAllPokemon(pokemonsTemp = []) {
            try {
                let result;
                await fetch(this.state.url).then(async (response) => {
                    if (!response.ok) throw new Error("Error: " + response.status);
                    result = await response.json()
                    for (let item in result.results)
                    {
                        await fetch(`${result.results[item].url}`).then(async (pokemonDetail) => {
                            if (!pokemonDetail.ok) throw new Error("Error: " + pokemonDetail.status);
                            let valid = true;
                            let pokemon = await pokemonDetail.json();
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
                                pokemonsTemp.push(pokemon);
                            }
                        });
                    }
           
                });

                if (pokemonsTemp.length >= 20 || result.next == null)
                {
                    this.state.pageState = pageState.LOADED;
                    this.state.url = result.next;
                    this.pokemons.push(...pokemonsTemp);
                    this.loadImage();
                } else {
                    this.state.url = result.next;
                    this.fetchAllPokemon(pokemonsTemp);
                }
            } catch(err) {
                console.log("Error occured: " + err.message);
            }
        },

        handleElementScroll() {
            this.scrollPosition = window.scrollY;
            if (this.state.url == null) return;
            if (window.innerHeight + this.scrollPosition >= document.body.offsetHeight && this.state.pageState != pageState.NEWLOAD && this.state.pageState != pageState.LOADEDSEARCH) {
                this.state.pageState = pageState.NEWLOAD;
                setTimeout(() => {
                    this.fetchAllPokemon();
                }, 500);
                this.loadImageIndex += 20;
            }
        },

        async loadImage() 
        {
            for (let i = this.loadImageIndex; i < this.pokemons.length; i++)
            {
                const promise = new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = this.pokemons[i].sprites.front_default;
                    img.classList.add('img');

                    img.onload = () => resolve({
                        id: 'pokemon' + this.pokemons[i].id,
                        img
                    });
                    img.onerror = () => reject(new Error("Error Load Image"));
                });

                promise.then((pokemon) => {
                    document.getElementById(pokemon.id).innerHTML = "";
                    document.getElementById(pokemon.id).appendChild(pokemon.img);
                });
            }
        },

        async search() 
        {
            if (this.state.pageState != pageState.LOADING)
            {
                this.loadImageIndex = 0;
                const value = await document.getElementById("search-input").value;
                this.state.pageState = pageState.SEARCHING;
                if (value.length < 1){
                    this.pokemons = [];
                    this.state.url = `https://pokeapi.co/api/v2/pokemon/`;
                    this.state.pageState = pageState.LOADING;
                    this.fetchAllPokemon();
                }
                else
                {
                    try {
                        fetch(`https://pokeapi.co/api/v2/pokemon/${value}/`).then(async response => {
                            this.pokemons = [];
                            if (response.status == 404) {
                                this.state.pageState = pageState.LOADED;
                                throw new Error("Not Found");
                            } 

                            if (!response.ok) {
                                this.state.pageState = pageState.LOADED;
                                throw new Error("Failed to fetch");
                            }
                            const pokemonSearch = await response.json();
                            this.pokemons.push(pokemonSearch);
                            this.state.pageState = pageState.LOADEDSEARCH;
                            this.loadImage();
                        }).catch(err => {
                            console.log("Error Occured: " + err.message);
                        });
                    } catch (err) {
                        console.log('Error Occured: ' + err.message);
                    }
                } 
            }
        },
        changeTypeFilter(filter)
        {
            this.state.filter.type = filter;
            this.loadImageIndex = 0;
            this.state.url = `https://pokeapi.co/api/v2/pokemon/`;
            this.pokemons = [];
            Array.from(document.getElementsByClassName("filter-tags-type")).forEach(element => {
                if (element.innerText == filter) 
                {
                    element.classList.add('active')
                } else {
                    element.classList.remove('active');
                }
            });

            
            this.state.pageState = pageState.LOADING;
            this.fetchAllPokemon(); 
        },
        changeTypeGame(filter)
        {  
            this.state.filter.game = filter;
            this.loadImageIndex = 0;
            this.state.url = `https://pokeapi.co/api/v2/pokemon/`;
            this.pokemons = [];
            Array.from(document.getElementsByClassName("filter-tags-games")).forEach(element => {
                if (element.innerText == filter) 
                {
                    element.classList.add('active')
                } else {
                    element.classList.remove('active');
                }
            });

            
            this.state.pageState = pageState.LOADING;
            this.fetchAllPokemon(); 
        }
    },
     
    mounted()
    {
        document.addEventListener("scroll", this.handleElementScroll);
        setTimeout(() => {
            this.fetchAllPokemon();
        }, 500);
    }
});

app.mount("#index");