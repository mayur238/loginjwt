import { Injectable, OnInit } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http'
import { Observable } from 'rxjs';
import { AuthKey } from 'src/app/class/auth-key';
import { Login } from '../class/login';
@Injectable({
  providedIn: 'root'
})
export class AuthService{

  private readonly AUTH_URL : string = 'http://localhost:8080/auth';

  constructor(
    private http:HttpClient
    ) { }

  public getServerPublicKey() : Observable<any>{
   return this.http.get<any>(`${this.AUTH_URL}/serverpublickey`);
  }

  public getServerRandomString() : Observable<any>{
   return this.http.get<any>(`${this.AUTH_URL}/serverrandomstr`);
  }

  public addClientRandomString(authKey : AuthKey) :Observable<any>{
    return this.http.post<any>(`${this.AUTH_URL}/clientrandomstr`, authKey);
  }

  public addClientPreSecretKey(authKey : AuthKey) :Observable<any>{
    return this.http.post<any>(`${this.AUTH_URL}/clientpresecretstr`, authKey);
  }

  public getTokenBeforeLogin(keyId:number):Observable<any>{
    return this.http.post<any>(`${this.AUTH_URL}/token/${keyId}`,{});
  }

  public login(authUser: Login, keyId:number) :Observable<any>{
    return this.http.post<any>(`${this.AUTH_URL}/authenticate?keyid=${keyId}`, authUser);
  }

  public getData(authUser:any, keyId:number){
    return this.http.post<any>(`http://localhost:8080/print?keyid=${keyId}`, authUser);
  }
  public addInitVector(authKey:AuthKey){
    return this.http.post<any>(`${this.AUTH_URL}/initvector`, authKey);
  }
}
