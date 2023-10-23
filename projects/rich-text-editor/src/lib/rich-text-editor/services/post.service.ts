import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

  

@Injectable({

  providedIn: 'root'

})

export class PostService {

  private url = 'http://localhost:3000/upload';

   

  constructor(private httpClient: HttpClient) { }

  

  getPosts(){

    return this.httpClient.get(this.url);

  }

  

  create(post : any){

    return this.httpClient.post(this.url, JSON.stringify(post));

  }

  

}