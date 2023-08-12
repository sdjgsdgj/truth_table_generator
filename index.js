function XOR(a, b) {
    return (a ^ b) > 0;
}

const operators = [
    {
        "input": "->",
        "html": "&#8594;",
        "latex": " \\rightarrow ",
        "name": "Material implication",
        "url": "https://en.wikipedia.org/wiki/Material_conditional",
        "hierachy": 4,
        "func": (a, b) => { return !a || a && b; }
    },
    {
        "input": "<->",
        "html": "&#8596;",
        "latex": " \\leftrightarrow ",
        "name": "Material equivalence",
        "url": "https://en.wikipedia.org/wiki/Material_equivalence",
        "hierachy": 5,
        "func": (a, b) => { return a == b; }
    },
    {
        "input": "!",
        "html": "&#172;",
        "latex": " \\lnot ",
        "name": "Negation",
        "url": "https://en.wikipedia.org/wiki/Negation",
        "hierachy": 0,
        "func": (a, b) => { return !b; }
    },
    {
        "input": "&&",
        "html": "&#8743;",
        "latex": " \\land ",
        "name": "Logical conjunction",
        "url": "https://en.wikipedia.org/wiki/Logical_conjunction",
        "hierachy": 1,
        "func": (a, b) => { return a && b; }
    },
    {
        "input": "||",
        "html": "&#8744;",
        "latex": " \\lor ",
        "name": "Logical (inclusive) disjunction",
        "url": "https://en.wikipedia.org/wiki/Logical_disjunction",
        "hierachy": 3,
        "func": (a, b) => { return a || b; }
    },
    {
        "input": "#",
        "html": "&#8853;",
        "latex": " \\oplus ",
        "name": "Exclusive disjunction",
        "url": "https://en.wikipedia.org/wiki/Exclusive_or",
        "hierachy": 2,
        "func": (a, b) => { return XOR(a, b); }
    },
    {
        "input": "1",
        "html": "&#8868;",
        "latex": " \\top ",
        "name": "Tautology",
        "url": "https://en.wikipedia.org/wiki/Tautology_(logic)"
    },
    {
        "input": "0",
        "html": "&#8869;",
        "latex": " \\bot ",
        "name": "Contradiction",
        "url": "https://en.wikipedia.org/wiki/Contradiction"
    }
];

function get_input_and_varibles(input_str) {
    const input = [];
    const variables = [];

    for (var i = 0; i < input_str.length;) {
        var c = input_str[i];

        // space
        if (c == ' ') {
            i++;
            continue;
        }

        // opening bracket
        if (c == '(') {
            input.push({ type: '(' });

            i++;
            continue;
        }

        // closing bracket
        if (c == ')') {
            input.push({ type: ')' });

            i++;
            continue;
        }

        // true
        if (c == '1') {
            input.push({ type: 'c', value: true });

            i++;
            continue;
        }

        // false
        if (c == '0') {
            input.push({ type: 'c', value: false });

            i++;
            continue;
        }

        // operator
        var j = 0;
        for (; j < operators.length; j++) {
            const o = operators[j];

            const index = input_str.indexOf(o.input, i);
            if (index == i) {
                input.push({ type: 'o', value: j });

                i += o.input.length;
                leave_loop = true;
                break;
            }
        }
        if (j < operators.length)
            continue;

        // variable
        if (input.length == 0 || input[input.length - 1].type != 'v') {
            const index = variables.indexOf(c);
            if (index == -1) {
                input.push({ type: 'v', value: variables.length });
                variables.push(c);
            } else
                input.push({ type: 'v', value: index });
        }
        else
            variables[input[input.length - 1].value] += c;
        i++;
    }

    return [input, variables];
}

function get_levels(input, levels, offset = 0) {
    var inverted = false;
    for (var j = offset; j < input.length; j++) {
        const i = input[j];

        if (i.type == '(') {
            levels.push({ type: 'l', value: [], inverted: inverted });
            inverted = false;
            j = get_levels(input, levels[levels.length - 1].value, j + 1);
        } else if (i.type == ')')
            return j;
        else if (i.type == 'o' && i.value == 2)  // NOT
            inverted = !inverted;
        else {
            if (i.type == 'v' || i.type == 'c')
                i.inverted = inverted;
            levels.push(i);
            inverted = false;
        }
    }
}

function calculate_output(variable_values, level) {
    const operands = [];
    const operations = [];
    var last_operator = null;

    level.forEach((el, i) => {
        if (el.type == 'o') {
            last_operator = el.value;
            return;
        }

        var push_value;
        if (el.type == 'l')
            push_value = calculate_output(variable_values, el.value);
        else if (el.type == 'c')
            push_value = el.value;
        else
            push_value = variable_values[el.value];
        operands.push(XOR(push_value, el.inverted));

        if (last_operator != null) {
            operations.push({
                "vai": operands.length - 2,
                "o": last_operator,
                "vbi": operands.length - 1,
                "index": operations.length
            });
            last_operator = null;
        }
    });

    operations.sort((a, b) => {
        const o_diff = operators[a.o].hierachy - operators[b.o].hierachy;

        if (o_diff != 0)
            return o_diff;

        return a.index - b.index;
    });

    var result = null;
    for (const operation of operations) {
        result = operators[operation.o].func(
            operands[operation.vai],
            operands[operation.vbi]);

        operands[operation.vai] = result;
        operands[operation.vbi] = result;
    }

    return result == null ? operands[0] : result;
}

function get_truth_table(levels, variables_cnt) {
    const truth_table = [];

    const N = Math.pow(2, variables_cnt);
    for (var n = 0; n < N; n++) {
        const variable_values = [];

        for (var i = 0; i < variables_cnt; i++)
            variable_values.unshift(((n >> i) & 1) > 0);

        const output = calculate_output(variable_values, levels);
        variable_values.push(output);

        truth_table.push(variable_values);
    }

    return truth_table;
}

function get_fancy_str(level, variable_names, operator_display_type) {
    var fancy_str = '';

    for (const el of level) {
        if (el.inverted == true)
            fancy_str += operators[2].html;

        if (el.type == 'l') {
            fancy_str += '(';
            fancy_str += get_fancy_str(el.value, variable_names, operator_display_type);
            fancy_str += ')';
        } else if (el.type == 'v')
            fancy_str += variable_names[el.value];
        else if (el.type == 'c')
            fancy_str += operators[el.value ? 6 : 7][operator_display_type];
        else
            fancy_str += operators[el.value][operator_display_type];
    }

    return fancy_str;
}

function generate_truth_table_html(levels, variable_names) {
    // get truthtable
    const truth_table = get_truth_table(levels, variable_names.length);

    const table_html = document.getElementById('table');
    table_html.innerHTML = '';

    // fancy str
    const fancy_str = get_fancy_str(levels, variable_names, 'html');

    // header
    const header_html = document.createElement('tr');
    variable_names.forEach(vn => header_html.innerHTML += `<td style="border-bottom: 5px solid black">${vn}</td>`);
    header_html.innerHTML += `<td style="border-left: 5px solid black; border-bottom: 5px solid black">${fancy_str}</td>`;
    table_html.appendChild(header_html);

    // data
    truth_table.forEach(row => {
        const row_html = document.createElement('tr');
        row.forEach((el, i) => {
            const el_str = el ? '1' : '0';
            if (i == row.length - 1)
                row_html.innerHTML += `<td style="border-left: 5px solid black;">${el_str}</td>`;
            else
                row_html.innerHTML += `<td>${el_str}</td>`;
        });

        table_html.appendChild(row_html);
    });
}

function get_latex_str(levels, variable_names) {
    // get truthtable
    const truth_table = get_truth_table(levels, variable_names.length);

    // latex init
    var latex_str = '\\begin{displaymath}\n\\begin{array}{';
    for (var i = 0; i < variable_names.length; i++)
        latex_str += i == 0 ? 'c' : ' c';
    latex_str += '|c}\n';

    // header
    variable_names.forEach((vn, i) => {
        latex_str += vn + ' & ';
    });
    latex_str += get_fancy_str(levels, variable_names, 'latex') + ' \\\\ \\hline\n';

    // data
    truth_table.forEach(row => {
        row.forEach((el, i) => {
            latex_str += (el ? 'T' : 'F') + (i == row.length - 1 ? ' \\\\\n' : ' & ');
        });
    });

    // latex exit
    latex_str += '\\end{array}\n\\end{displaymath}';

    return latex_str;
}

function generate_truth_table_onclick() {
    // get input str
    const input_html = document.getElementById('input');
    const input_str = input_html.value;

    // get input data
    const [input, variable_names] = get_input_and_varibles(input_str);

    // get levels
    const levels = [];
    get_levels(input, levels);

    // generate truth table
    generate_truth_table_html(levels, variable_names);
}

function copy_latex_table_onclick() {
    // get input str
    const input_html = document.getElementById('input');
    const input_str = input_html.value;

    // get input data
    const [input, variable_names] = get_input_and_varibles(input_str);

    // get levels
    const levels = [];
    get_levels(input, levels);

    // get latex str
    const latex_str = get_latex_str(levels, variable_names);

    // copy to clipboard
    navigator.clipboard.writeText(latex_str);
}

function generate_info_div(div_html) {
    div_html.innerHTML += '<br>';
    operators.forEach(o => {
        div_html.innerHTML += `<a href="${o.url}" target="_blank">${o.name}</a><br>`;
        div_html.innerHTML += `<a>input: ${o.input}</a><br>`;
        div_html.innerHTML += `<a>symbol: ${o.html}</a><br><br>`;
    });
}

function toggle_info_onclick() {
    const button_html = document.getElementById('toggle-info');
    const div_html = document.getElementById('info-div');

    if (div_html.style.display == 'none') {
        div_html.style.display = 'block';
        button_html.value = '\u25B2';

        if (div_html.innerHTML == '')
            generate_info_div(div_html);
    } else {
        div_html.style.display = 'none';
        button_html.value = '\u25BC';
    }
}