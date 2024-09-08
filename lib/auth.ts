import {jwtVerify} from 'jose';


declare module "jose"{
  export interface JWTPayload {
    user : string,
    pass : string,
    kodeloket : string
  }
}

interface IsVerif {
  status : boolean ,
  data? : {
    user : string,
    pass : string,
    kodeloket : string
  }
}

export const verifyAuth = async (token : string) : Promise<IsVerif> => {
  try {

    const screetKey =process.env.SCREET_KEY_JWT || ""
    const verified =  await jwtVerify(token, new TextEncoder().encode(screetKey));

    const res : IsVerif = {
      status : true,
      data : {
        user : verified.payload.user,
        pass : verified.payload.pass,
        kodeloket : verified.payload.kodeloket
      }
    }

    return res
  } catch (error) {
    const res : IsVerif = {
      status : false
    }
    return res
  }

}