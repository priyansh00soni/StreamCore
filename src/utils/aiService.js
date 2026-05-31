import ApiError from "./ApiError.js"
import generateWithAI from "./gemini.js"

const isContentModerated = async(content)=>{
    const result = await generateWithAI(`You are a strict content moderator for a video platform. Analyze the following content and return only "true" if it is appropriate, respectful, and adds value. Return only "false" if it is toxic, spammy, hateful, sexually explicit, threatening, or meaningless/gibberish with no value. Return absolutely nothing else except "true" or "false". Content: "${content}"`)
    if(!result) throw new ApiError(500, "Something went wrong.")
    const isValid = result.trim().toLowerCase() === "true" //=== "true" compares that string to the literal string "true". If they match, the whole expression evaluates to the boolean true. If they do not match, it evaluates to the boolean false.
    return isValid
}

const semanticSearch = async(query)=>{
    const result = await generateWithAI(`You are a YouTube search query optimizer. Convert the following vague user query into relevant search keywords separated by spaces that can be used to find related videos. Return only the keywords, nothing else. Query: "${query}"`)

    if(!result) throw new ApiError(500, "Something went wrong.")
    return result
}

export {isContentModerated,semanticSearch}