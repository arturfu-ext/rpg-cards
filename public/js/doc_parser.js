/**
 * @typedef {Object} ActionInfo
 * @property {string} summary - The summary of the action.
 * @property {string} description - The description of the action.
 * @property {string} example - The example usage of the action.
 * @property {string} category - The category of the action.
 */

/**
 * @type {Object.<string, ActionInfo>}
 */
var card_action_info = {};

/**
 * This function fetches the content of cards.js and parses the JSDoc comments
 * for all functions starting with "card_element_".
 * @returns {Promise} A promise that resolves when the parsing is complete.
 */
function parse_card_actions() {
    return fetch('js/cards.js')
        .then(response => response.text())
        .then(text => {
            const regex = /\/\*\*([\s\S]*?)\*\/[\s\n]*function\s+(card_element_\w+)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const function_name = match[2];
                const doc_comment = match[1];

                const summary_regex = /@summary (.*)/;
                const description_regex = /@description (.*)/;
                const example_regex = /@example (.*)/;
                const category_regex = /@category (.*)/;

                const summary_match = doc_comment.match(summary_regex);
                const description_match = doc_comment.match(description_regex);
                const example_match = doc_comment.match(example_regex);
                const category_match = doc_comment.match(category_regex);

                if (summary_match && example_match) {
                    card_action_info[function_name] = {
                        summary: summary_match[1].trim(),
                        description: description_match ? description_match[1].trim() : "",
                        example: example_match[1].trim(),
                        category: category_match ? category_match[1].trim() : "Basic"
                    };
                }
            }
        });
}
