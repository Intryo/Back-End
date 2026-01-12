import Datauriparser from "datauri/parser.js";
import path from "path";
const parser=new Datauriparser();
const getdataUri=(file)=>{
    return parser.format(path.extname(file.originalname).toString(),file.buffer).content;
}
export default getdataUri;