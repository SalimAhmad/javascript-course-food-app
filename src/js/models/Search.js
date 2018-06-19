import axios from 'axios';
import { key, proxy } from '../config';

export default class Search{
    //constructor is a method that ges called as soon as we call an object based on this class
    constructor(query){
        this.query = query;
    }

    async getResults() {
    try {
        const res = await axios(`${proxy}http://food2fork.com/api/search?key=${key}&q=${this.query}`); //just like fetch it will return a promise
        this.result = res.data.recipes;
        // console.log(this.result);
    } catch (error) {
        alert(error);
    }
}
}