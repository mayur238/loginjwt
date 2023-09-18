import { Component } from '@angular/core';
import { AuthService } from './auth/services/auth.service';
// import * as JSEncrypt from 'jsencrypt';
import * as CryptoJS from 'crypto-js';
import * as forge from 'node-forge';
import { AuthKey } from './class/auth-key';
import { delay, firstValueFrom } from 'rxjs';
import { Login } from './auth/class/login';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'login';

  private readonly LENGTH_CLIENT_RANDOM_STRING: number = 10; 
  private readonly LENGTH_CLIENT_PRESECRET_KEY: number = 10;

  private publicKey: string = '';
  private clientPreSecretKey: string = '';

  authUser: Login = new Login();
  encryptedCredentials: Login = new Login();
  private keyId: any;
  constructor(
    private authService: AuthService
  ) {
    this.authUser = new Login();
    this.initialization();

  }
  secretKey:any;
  login() {
    const user: Login = this.authUser;

    for (const key in user) {
      if (Object.prototype.hasOwnProperty.call(user, key)) {
        const value = user[key as keyof Login]; // Cast 'key' to the correct keyof Login type
        console.log(`Field: ${key}, Value: ${value}`);
        console.log(this.encryptWithAES(this.authUser[key as keyof Login]));
      }
    }
      
    
    const data = this.encryptWithAES(JSON.stringify(this.authUser));
    console.log(data);
    
    this.encryptedCredentials.username = this.encryptDataWithRSA(this.authUser.username);
    this.encryptedCredentials.password = this.encryptDataWithRSA(this.authUser.password);

    this.authService.login(this.encryptedCredentials, this.keyId).subscribe(
      (response) => {
        console.log(response);
        const tokenBeforeLogin = response['key'];
        sessionStorage.setItem('TOKEN', tokenBeforeLogin);
      },
      (error) => {
        console.log(error);

      }
    );
  }
  iv:any;
  private async initialization() {
    this.iv = this.generateInitilizationVector(16);
    // this.iv = CryptoJS.enc.Utf8.parse(this.iv);
    console.log(this.iv);
    
    console.log(CryptoJS.enc.Utf8.parse(this.iv));
    
    // console.log(this.encrypt("Mayur"));
    // console.log(this.decrypt(this.encrypt("Mayur")));
    await this.addServerPublicKeyInSessionStorage();
    console.log("1");

    await this.getServerRandomString();
    console.log("2");

    await this.addClientRandomString();
    console.log("3");
    await this.addInitVector();
    await this.addClientPreSecretKey();
    console.log("finally");

    this.keyId = sessionStorage.getItem("KEY_ID");
    console.log("finally2", this.keyId);

    await this.getTokenBeforeLogin(this.keyId);
    console.log("after token");

    const srs = sessionStorage.getItem("SERVER_RANDOM_STR");
    const crs = sessionStorage.getItem("CLIENT_RANDOM_STR");
    const cpk = sessionStorage.getItem("CLIENT_PRESECRET_KEY");
    if(srs && crs && cpk){

      this.secretKey =   srs + crs+cpk;
      console.log(this.secretKey);
    }
    
  }

  private async addClientPreSecretKey() {
    try {
      this.clientPreSecretKey = await this.generateClientPreSecretKey(this.LENGTH_CLIENT_PRESECRET_KEY);
      const encryptedClientPreSecretKey = this.encryptDataWithRSA(this.clientPreSecretKey);

      let authKey: AuthKey = new AuthKey();

      if (this.keyId) {
        authKey.id = parseInt(this.keyId);
        authKey.clientPreSecretKey = encryptedClientPreSecretKey;
        const response = await firstValueFrom(this.authService.addClientPreSecretKey(authKey));
        if (response != undefined) {
          sessionStorage.setItem('CLIENT_PRESECRET_KEY', this.clientPreSecretKey);
          console.log("done");
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  private async getServerRandomString() {
    try {
      // Making the API call and wait for the response
      const serverRandomStringObject = await firstValueFrom(this.authService.getServerRandomString());

      const serverRandomString = serverRandomStringObject.serverRandomString;
      console.log(serverRandomStringObject.id);
      this.keyId = serverRandomStringObject.id;
      sessionStorage.setItem('KEY_ID', JSON.stringify(serverRandomStringObject.id));
      sessionStorage.setItem('SERVER_RANDOM_STR', serverRandomString);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  private async addClientRandomString() {
    const clientRandomString = await this.generateClientRandomString(this.LENGTH_CLIENT_RANDOM_STRING);
    const encryptedClientRandomString = this.encryptDataWithRSA(clientRandomString);
    let authKey: AuthKey = new AuthKey();

    const keyId = sessionStorage.getItem('KEY_ID');
    if (keyId) {
      authKey.id = parseInt(keyId);
      authKey.clientRandomString = encryptedClientRandomString;
      const response = firstValueFrom(this.authService.addClientRandomString(authKey));
      if (response != undefined) {
        sessionStorage.setItem('CLIENT_RANDOM_STR', clientRandomString);
      }
    }
  }

  encryptDataWithRSA(data: string): string {
    try {
      // Create an RSA public key object from the PEM-encoded key
      const publicKey = forge.pki.publicKeyFromPem(this.publicKey);

      // Encrypt the data using RSA
      const encryptedData = publicKey.encrypt(data, 'RSAES-PKCS1-V1_5', {
        md: forge.md.sha256.create(),
      });
      
      // Convert the encrypted data to a Base64-encoded string
      return btoa(encryptedData);
    } catch (error) {
      console.error('Encryption error:', error);
      return '';
    }
  }

 
  private generateClientRandomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters.charAt(randomIndex);
    }
    console.log("client random string :" + randomString);

    return randomString;
  }

  private async generateClientPreSecretKey(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters.charAt(randomIndex);
    }
    console.log("client presecret key :" + randomString);
    return randomString;
  }


  private generateInitilizationVector(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters.charAt(randomIndex);
    }
    console.log("client random string :" + randomString);

    return randomString;
  }

  private async addServerPublicKeyInSessionStorage() {
    try {
      // Call getServerPublicKey and wait for its completion
      const serverPublicKey = await this.getServerPublicKey();
      this.publicKey = serverPublicKey['key'];
      console.log(this.publicKey);

      // set server public key in sessionStorage
      sessionStorage.setItem('SERVER_PUBLIC_KEY', JSON.stringify(serverPublicKey));
    } catch (error) {
      console.error('Error:', error);
    }

  }

  private async addInitVector() {
    try {
      
      let authKey: AuthKey = new AuthKey();

      if (this.keyId) {
        authKey.id = parseInt(this.keyId);
        authKey.initVector = this.iv;
      // Call addInitVector and wait for its completion
      const initVector = await firstValueFrom(this.authService.addInitVector(authKey));
      console.log(initVector);

      // set server public key in sessionStorage
      sessionStorage.setItem('INITVECTOR', JSON.stringify(this.iv));
      }
    } catch (error) {
      console.error('Error:', error);
    }

  }

  private async getServerPublicKey() {
    try {
      // Making the API call and wait for the response
      const response = await firstValueFrom(this.authService.getServerPublicKey());

      console.log(response);

      return response;
    } catch (error) {
      console.error('Error:', error);
    }
  }

  private async getTokenBeforeLogin(key: number) {
    try {
      const response = await firstValueFrom(this.authService.getTokenBeforeLogin(key));
      const tokenBeforeLogin = response['key'];
      sessionStorage.setItem('TOKEN', tokenBeforeLogin);
      console.log(sessionStorage.getItem("TOKEN"));

    } catch (error) {
      console.log('Error:', error);

    }
  }


  // decryptData(encryptedData: string): string {
  //   try {
  //     // Create an RSA private key object from the PEM-encoded key
  //     const privateKey = forge.pki.privateKeyFromPem("-----BEGIN PRIVATE KEY-----MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBANVym9x7Bivod4oEZwmOlV4WQDP0Kyn0oP372GqpUZExXmeOBQpm1LtSUSjEX965hK50gR1aCj638obhdNoB14IKCoBvTALLoGMB/iMyrx1nUCMdW6L8fvYqGABT0u0pCazywcsILOjfTffwUj47smpUFOyBi41uUYOw1YKK5E1BAgMBAAECgYBKLrfeq98cOYH6NMd+udBNz9vmcpDh1wRw4St4/nm7xXWy9dfooo6Cv/w29/D93movm4wYIGf5HkMq/4Z2EjfMdlVXjswhRYtMuocZXaFhIzjIOdwAuA1dDPWxZv9GaLhA0jp0gKV86AbXAbVTAtQnlrdstZNoOLx/Yu9H8pUEAQJBAPjbNZu9NLVjJJxAoD2R3Gd5aJgaEWVEnR3CZwOsW8eNcncWEFtsuEhK7TbeYgPJ6n+hJG3VKOEFRpil2NAQTyECQQDbkzB6yuD+xrLZ0qSQ/DlQ67gBxmO42vU0c2EV98YPWfnUHzHVeKIuSTKpwjaanz9W8Q/8mlpMzEmwYfuwaNohAkAfN3hREfnzqv0jsKOpNYvdWwh41ARMnL/MxN8hQdS9govSTm082rV/NA7vrBPFf+Wvnuov8OZQ29WQPnWlG/ahAkEAhFV/YGIpnCOQ4yrKt/7rZFPMgHVa4KxGIChxmNXN7q6hnTB3zlp4FEFVYW6Fjkbv26xJoEo+pg5xUvaaxEVNQQJBAO4nUekAoJvnV+BKw7S4G0pqEKWXY1kOvlQqJ2dpjem4ootPaoca6XItbnP0hvugMQ6vM8kMHQf1d9eELehj944=-----END PRIVATE KEY-----");

  //     // Decode the Base64-encoded encrypted data
  //     const encryptedBytes = forge.util.decode64(encryptedData);

  //     // Decrypt the data using RSA (without OAEP)
  //     const decryptedData = privateKey.decrypt(encryptedBytes, 'RSAES-PKCS1-V1_5');
  //     console.log(decryptedData);

  //     return decryptedData;
  //   } catch (error) {
  //     console.error('Decryption error:', error);
  //     return '';
  //   }
  // }

  data: any;
  getData() {
    const formData = new FormData();
    this.data = null;
    if(this.selectedFile!=undefined){
      formData.append('file', this.selectedFile);
      formData.append('fileType', 'png');
      const authUserBlob = new Blob([JSON.stringify(this.authUser)], { type: 'application/json' });

      // Append the company data Blob to the FormData object
      formData.append('data', authUserBlob);
      formData.append('dataType', 'Password');
      console.log(authUserBlob);
      
    }
    console.log(this.selectedFile);
    
    
    console.log(formData);
    
      console.log(this.decryptWithAES(JSON.stringify(formData)));
      
    const data = this.encryptWithAES(JSON.stringify(formData));
    console.log(data);
    
    this.authService.getData(data,this.keyId).subscribe(
      (response) => {
        this.data = response;
      }
    )
  }


  // private initVector = ;
  // private secretKey = 'BeSk5FRncm5trpspdE2Iqz0aUz0SnTq4';

  encryptWithAES(value: string): string {
    console.log( this.secretKey);
    
    const key = CryptoJS.enc.Utf8.parse(this.secretKey);
    const iv = CryptoJS.enc.Utf8.parse(this.iv);

    const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(value), key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return encrypted.toString();
  }

  decryptWithAES(encryptedValue: string): string {
    const key = CryptoJS.enc.Utf8.parse(this.secretKey);
    const iv = CryptoJS.enc.Utf8.parse(this.iv);

    const decrypted = CryptoJS.AES.decrypt(encryptedValue, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

   generateRandomIV() {
    const iv = CryptoJS.lib.WordArray.random(16); // 16 bytes for AES IV
    console.log("iv :" + iv);
    
    return iv.toString();
  }

  selectedFile: File | undefined;  // To store the selected file
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }
}
