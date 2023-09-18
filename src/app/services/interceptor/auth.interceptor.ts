import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  token: any;
  constructor() { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const authorizationMap: Record<string, string> = {
      '/auth': '',
      '/auth/authenticate': `Bearer ${sessionStorage.getItem('TOKEN')}`
    };

    const url = request.url;
    let authorizationToken: any;
 
    
    if (url.includes('/auth/authenticate')) {
      console.log("1x",url);
      console.log(authorizationMap['/auth/authenticate']);
      
      authorizationToken = authorizationMap['/auth/authenticate'];

    } else if (url.includes('/auth')) {
      console.log("2x",url);
      authorizationToken = authorizationMap['/auth'];

    } else {
      console.log("3x",url);
      console.log( authorizationMap['/auth/authenticate']);
      
      authorizationToken = authorizationMap['/auth/authenticate'];
    }


    request = request.clone({
      setHeaders: {
        'Authorization': `${authorizationToken}`,
        'Content-Type'  : `angular/json`,
      },
    });



    return next.handle(request);
  }
}
