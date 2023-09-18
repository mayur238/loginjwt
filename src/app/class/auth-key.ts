export class AuthKey {
    id!: number;
    serverRandomString!: string;
    clientRandomString!:string;
    clientPreSecretKey!:string;
    initVector!:string;
}
