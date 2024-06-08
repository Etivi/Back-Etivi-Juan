type InputObject = {
    [key: string]: string;
  }
  
  type OutputObject = {
    [key: string]: string;
  }
  
export default function removeEmptyValues(obj: InputObject): OutputObject {
    const newObj: OutputObject = {};
    for (let key in obj) {
      if (obj[key] !== '') {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  }