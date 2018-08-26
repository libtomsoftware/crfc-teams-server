module.exports = new class ApiCommonParser {
    parsePostData(json) {
        return JSON.parse(JSON.parse(json).json);
    }
};
