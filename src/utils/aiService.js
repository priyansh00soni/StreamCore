import ApiError from "./ApiError.js"
import generateWithAI from "./gemini.js"

const isContentModerated = async(content)=>{
    const result = await generateWithAI(`You are a strict content moderator for a video platform. Analyze the following content and return only "true" if it is appropriate, respectful, and adds value. Return only "false" if it is toxic, spammy, hateful, sexually explicit, threatening, or meaningless/gibberish with no value. Return absolutely nothing else except "true" or "false". Content: "${content}"`)
    if(!result) throw new ApiError(500, "Something went wrong while moderating content.")
    const isValid = result.trim().toLowerCase() === "true" //=== "true" compares that string to the literal string "true". If they match, the whole expression evaluates to the boolean true. If they do not match, it evaluates to the boolean false.
    return isValid
}

const semanticSearch = async(query)=>{
    try {
        const result = await generateWithAI(`You are a search keyword optimizer for a video platform like YouTube.
        Your task is to expand the user's search query into related keywords to find the most relevant videos.
        
        Rules:
        - Return ONLY single keywords, no phrases
        - Each keyword must be DIRECTLY related to the query — no loose associations
        - Separate keywords with a single space, NO newlines, NO punctuation
        - Include variations, synonyms, and closely related terms of the original query
        - Do NOT invent context the user didn't imply (no platforms, years, brands unless user said so)
        - The original query word itself must always be included
        
        Examples:
        Query: "gaming" → gaming game games gamer gameplay videogame esport
        Query: "cooking" → cooking cook recipe food kitchen cuisine
        Query: "javascript" → javascript js coding programming webdev frontend
        Query: "workout" → workout exercise fitness gym training bodyweight
        
        Query: "${query}"`)
        
        return result.replace(/\n/g, " ").replace(/\s+/g, " ").trim()
    } catch (error) {
        console.warn("Semantic search failed:", error.message);
        return query;
    }
}

const generateTags = async(title,description)=>{
    const result = await generateWithAI(`You are a professional YouTube SEO expert. Generate 15 comma separated SEO tags for a video with title: "${title}" and description: "${description}". Return only comma separated tags, nothing else.`)

    if(!result) throw new ApiError(500, "Something went wrong while generating tags.")
    return result
}

export {isContentModerated,semanticSearch,generateTags}