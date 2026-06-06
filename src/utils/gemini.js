import { GoogleGenAI } from "@google/genai";
import ApiError from "./ApiError.js";
const ai = new GoogleGenAI({})

const generateWithAI = async(prompt)=>{
    try {
        const res = await ai.models.generateContent({
            model: "gemma-4-31b-it",
            contents: prompt
        })
        
        return res.text
    } catch (error) {
        if(error.status==429) throw new ApiError(429, "AI service is busy. Please try again in a few seconds.")
        throw new ApiError(500,"Something went wrong.")
    }
}


export default generateWithAI