$(document).ready(function () {
    parse_card_actions().then(function () {
        var docs_container = $("#documentation-container");
        docs_container.empty();

        var action_groups = {};

        // Group actions by category
        for (var function_name in card_action_info) {
            var info = card_action_info[function_name];
            if (!action_groups[info.category]) {
                action_groups[info.category] = [];
            }
            action_groups[info.category].push(info);
        }

        // Sort actions within each category
        for (var group_name in action_groups) {
            action_groups[group_name].sort(function (a, b) {
                return a.example.localeCompare(b.example);
            });
        }

        // Generate documentation for each category
        for (var group_name in action_groups) {
            var group_container = $('<div class="category-container"></div>');
            group_container.append('<h2 class="category-title">' + group_name + '</h2>');

            var table = $('<table class="table action-table"></table>');
            table.append('<thead><tr><th>Name</th><th>Summary</th><th>Description</th><th>Example</th></tr></thead>');

            var tbody = $('<tbody></tbody>');
            var actions = action_groups[group_name];
            for (var i = 0; i < actions.length; ++i) {
                var info = actions[i];
                var row = $('<tr></tr>');
                row.append('<td class="action-name">' + info.example.split(" ")[0] + '</td>');
                row.append('<td class="action-summary">' + info.summary + '</td>');
                row.append('<td class="action-description">' + info.description + '</td>');
                row.append('<td class="action-example">' + info.example + '</td>');
                tbody.append(row);
            }

            table.append(tbody);
            group_container.append(table);
            docs_container.append(group_container);
        }
    });
});
