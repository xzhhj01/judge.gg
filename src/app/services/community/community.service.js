import axios from "axios";

const API_BASE_URL = "http://15.164.210.123:8080";

export const communityService = {
    async getPosts(filter = {}) {
        try {
            const queryParams = new URLSearchParams(filter).toString();
            const response = await axios.get(
                `${API_BASE_URL}/posts?${queryParams}`
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    async getPost(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/posts/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    async createPost(postData) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/posts`,
                postData
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // async uploadVideo(formData) {
    //   try {
    //     const response = await axios.post(`${API_BASE_URL}/posts/upload`, formData, {
    //       headers: {
    //         'Content-Type': 'multipart/form-data',
    //       },
    //     });
    //     return response.data;
    //   } catch (error) {
    //     throw error.response?.data || error.message;
    //   }
    // },

    async votePost(postId, choice) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/posts/${postId}/vote`,
                { choice }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // async addComment(postId, comment) {
    //   try {
    //     const response = await axios.post(`${API_BASE_URL}/posts/${postId}/comments`, comment);
    //     return response.data;
    //   } catch (error) {
    //     throw error.response?.data || error.message;
    //   }
    // },

    //   async getComments(postId) {
    //     try {
    //       const response = await axios.get(`${API_BASE_URL}/posts/${postId}/comments`);
    //       return response.data;
    //     } catch (error) {
    //       throw error.response?.data || error.message;
    //     }
    //   }
};
