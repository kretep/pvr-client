export const OVERRIDE_DATE = undefined; //'2019-06-13';

export const getCurrentDate = () => {
  return OVERRIDE_DATE ? OVERRIDE_DATE : new Date().toISOString().slice(0,10);
}

export const getNow = () => new Date().toISOString();
