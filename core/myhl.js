keyword_table = {
    data_types: ['word', 'number'],
    program_statements: ['print', 'read']
}

reserved_words = ['word', 'number', 'print', 'read', 'use', 'as', 'begin', 'vars', 'end', 'statements'];

var ExpressionObj = new Expression();

compile = function(lines) {
    var variable_table = {};

    parse_declaration = function(line) {
        var parts = line.split(' use as ');
        if (parts.length != 2) {
            throw new Error('Invalid syntax for variable declaration!');
        }

        var type = parts[1].trim();
        if ($.inArray(type, keyword_table.data_types) === -1) {
            throw new Error('Invalid data type: ' + type);
        }

        var identifiers = parts[0].split(',');

        for (var i in identifiers) {
            var iden = identifiers[i].trim();
            if (!is_valid_name(iden)) {
                throw new Error('Invalid identifier: ' + iden);
            }
            if (variable_table.hasOwnProperty(iden)) {
                throw new Error('Identifier was declared more than once: ' + iden);
            }

            variable_table[iden] = {
                'type': type,
                'value': null
            };
        }

        function is_valid_name(name) {
            name = name.trim();
            if (name.length === 0 || $.inArray(name, reserved_words) > -1) {
                return false;
            }
            if (name.charAt(0).match(/[a-z]|[A-Z]|_/) == null) {
                return false;
            }
            return name.match(/[a-z]|[A-Z]|[0-9]|_/g).length === name.length;
        }
    }


    parse_statement = function(line) {
        var result = null;
        line = line.trim();
        if (is_read_statement(line)) {
            result = read_statement(line);
        } else if (is_print_statement(line)) {
            result = print_statement(line);
        } else if (is_assignment_statement(line)) {
            result = assignment_statement(line);
        } else {
            throw new Error('Invalid statement! ' + line);
        }
        return result;

        function is_read_statement(line) {
            if (line.indexOf('read') !== -1) {
                return true;
            }
            return false;
        }

        function is_print_statement(line) {
            if (line.indexOf('print') !== -1) {
                return true;
            }
            return false;
        }

        function is_assignment_statement(line) {
            if (line.indexOf('=') !== -1) {
                var iden = line.split('=')[0].trim();
                if (variable_table.hasOwnProperty(iden)) {
                    return true;
                }
                return false;
            }
            return false;
        }

        function is_identifier(line) {
            if (variable_table.hasOwnProperty(line)) {
                return true;
            }
            return false;
        }

        function is_word(line) {
            if (line.length < 2) {
                return false;
            } else {
                if (line[0] === '"' && line[line.length - 1] === '"') {
                    return true
                }
                return false;
            }
        }

        function read_statement(line) {
            statement = line.split(' ');
            if (statement.length === 2 && statement[0] === 'read') {
                var iden = statement[1]
                if (variable_table.hasOwnProperty(iden)) {
                    return {'type': 'read', 'identifier': iden}
                } else {
                    throw new Error('Invalid statement: ' + line);
                }
            } else {
                throw new Error('Invalid statement: ' + line);
            }
        }

        function print_statement(line) {
            statement = line.split(' ');
            if (statement.length === 2 && statement[0] === 'print') {
                var iden = statement[1]
                if (variable_table.hasOwnProperty(iden)) {
                    return {'type': 'print', 'identifier': iden}
                } else {
                    throw new Error('Invalid statement: ' + line);
                }
            } else {
                throw new Error('Invalid statement: ' + line);
            }
        }

        function assignment_statement(line) {
            statement = line.split('=');
            var iden = statement[0].trim();
            var expression = statement[1].trim();
            var result = expression_statement(expression);
            return {'type': 'assignment', 'identifier': iden, 'statement': result};
        }

        function expression_statement(expression) {
            if (is_word(expression) || is_identifier(expression) || ExpressionObj.is_valid(expression, variable_table)) {
                return expression;
            }
            return new Error('Invalid expression: ' + expression);
        }
    }


    var status = null;
    var has_statement_block = false;
    var compiled = [];
    for (var i in lines) {
        var line = lines[i];
        if (status === null) {
            if (i == 0) {
                if (line != 'begin vars') {
                    throw new Error('Invalid start!'); // di ko kabalo unsa dapat ang error.. hehe
                } else {
                    status = 'vars';
                }
            } else {
                if (line != 'begin statements' || has_statement_block) {
                    throw new Error('Invalid block!'); // di napud ko sure unsa dapat ang error.
                }   else {
                    status = 'statements';
                    has_statement_block = true;
                }
            }
        } else {
            if ((line == 'end vars' && status === 'vars') || (line == 'end statements' && status === 'statements')) {
                status = null;
            }   else {
                var last_char = line.charAt(line.length - 1);
                if (last_char != ';') {
                    throw new Error('Statements should end with \';\'');
                }
                line = line.substring(0, line.length - 1);
                if (status === 'vars') {
                    parse_declaration(line);
                } else if (status === 'statements') {
                    compiled.push(parse_statement(line));
                } else {
                    throw new Error('Invalid statement!');
                }
            }
        }
    }

    if (status != null) {
        throw new Error('Block not closed!');
    }
    return {variable_table: variable_table, compiled: compiled};
}


var buffer = null;
execute = function(compiled) {
    var variables = compiled.variable_table;
    var lines = compiled.compiled;
    var blocked = false;
    var i = 0;

    buffer = null;
    var _t = setInterval(function() {
        try {
            var line = lines[i];
            if (line.type === 'read') {
                execute_read(line);
                if (!blocked) {
                    i++;
                }
            } else if (line.type === 'print') {
                execute_print(line);
                i++;
            } else {
                execute_assignment(line);
                i++;
            }

            if (i === lines.length) {
                $(document).trigger({ type: 'done' });
                clearInterval(_t);
            }
        } catch (e) {
            $(document).trigger({ type: 'error', message: e.message });
            clearInterval(_t);
        }
    }, 1);

    function execute_read(line) {
        var variable_name = line.identifier;
        var variable = variables[variable_name];
        if (blocked) {
            if (buffer) {
                if (variable.type === 'number') {
                    if (!isNaN(buffer) && buffer.length > 0 && +buffer >= 0 && +buffer === parseInt(+buffer)) {
                        variable.value = +buffer;
                    } else {
                        throw new Error('Type Error: Expected number instead of "' + buffer + '"');
                    }
                } else {
                    variable.value = '"' + buffer + '"';
                }
                buffer = null;
                blocked = false;
            }
        } else {
            $(document).trigger({ type: 'read', variable: variable_name });
            blocked = true;
        }
    }

    function execute_print(line) {
        var variable = variables[line.identifier];
        if (variable.value != null) {
            $(document).trigger({ type: 'print', message: variable.value });
        } else {
            throw new Error(line.identifier + ' has no value.');
        }
    }

    function execute_assignment(line) {
        var variable = variables[line.identifier];
        var statement = line.statement;

        if (variable.type === 'word') {
            if (is_word(statement)) {
                variable.value = statement;
            } else if (is_identifier(statement)) {
                variable.value = variables[statement];
            } else {
                throw new Error('Type Error: Expected word value');
            }
        } else {
            var tokens = ExpressionObj.tokenizer(line.statement);
            var ex = '';

            for (var i = 0; i < tokens.length; i++) {
                if (tokens[i].type === 'Operand' && is_identifier(tokens[i].value) && variables[tokens[i].value].type === 'number' && variables[tokens[i].value].value != null) {
                    ex += variables[tokens[i].value].value;
                } else if (!isNaN(tokens[i].value) || tokens[i].type === 'Operator' || is_parens(tokens[i].value)) {
                    ex += tokens[i].value;
                } else {
                    throw new Error('Type Error: ' + tokens[i].value + ' = ' + variables[tokens[i].value].value);
                }
            }

            val = parseInt(eval(ex));
            if (val < 0) {
                throw new Error('Invalid Number: ' + val);
            }

            variable.value = val;
        }
    }

    function is_word(line) {
        return line[0] === '"' && line[line.length-1] === '"';
    }

    function is_identifier(identifier) {
        return variables.hasOwnProperty(identifier);
    }

    function is_parens(input) {
        return input === '(' || input === ')';
    }
}

function Expression() {

    var tokens = null;
    var current = null;

    this.is_valid = function(expression, variable_table) {
        tokens = this.tokenizer(expression);
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            // check if operand values are valid
            if (token.type === 'Operand' && !is_parens(token.value)) {
                var regex = /^([a-zA-Z_]\w*|\d+)$/;
                if (!regex.test(token.value)) {
                    throw new Error('Invalid expression: ' + expression);
                }
            }
            // sets 'next' of each token to the next token
            if (i < tokens.length - 1) {
                token.next = tokens[i+1];
            } else {
                var end = {'type': 'End', 'value': 'end'};
                token.next = end;
            }
        }
        tokens.push(end);

        // check if non-number operands are declared identifiers
        for (var i = 0; i < tokens.length; i++) {
            var curr = tokens[i];
            var regex = /^\d+$/;
            if (curr.type === 'Operand' && !regex.test(curr.value) && !is_parens(curr.value)) {
                if (!variable_table.hasOwnProperty(curr.value)) {
                    throw new Error('Undeclared variable: ' + curr.value);
                }
            }
        }

        current = tokens[0];
        return recognizer();
    }

    function recognizer() {
        expression_recog();
        check_token(current, 'end');
        return true;
    }

    function expression_recog() {
        operand_recog();
        // while the current token is an operator
        while (current.type === 'Operator' && !is_parens(current)) {
            consume();
            operand_recog();
        }
        return;
    }

    function operand_recog() {
        if (current.type === 'Operand' && !is_parens(current.value)) {
            consume();
        } else if (current.value === '(') {
            consume();
            expression_recog();
            check_token(current, ')');
        } else {
            throw new Error('Invalid expression: ' + expression);
        }
        return;
    }

    function check_token(token, value) {
        if (token.value === value) {
            consume();
        } else {
            throw new Error('Invalid expression: ' + expression + current.value);
        }
        return;
    }

    function consume() {
        if (current.value !== 'end') {
            current = current.next;
        }
    }

    this.tokenizer = function(expression) {
        var operators = ['^', '*', '/', '%', '+', '-'];
        var tokens = [];
        var operand = '';

        for (var i = 0; i < expression.length; i++) {
            var curr = expression[i];
            if (curr !== ' ') {
                // current character is an operator
                if (operators.indexOf(curr) !== -1) {
                    if (operand !== '') {
                        tokens.push({'type': 'Operand', 'value': operand});
                        operand = '';
                    }
                    tokens.push({'type': 'Operator', 'value': curr});
                } else if (curr === '(' || curr === ')') {
                    if (operand !== '') {
                        tokens.push({'type': 'Operand', 'value': operand});
                        operand = '';
                    }
                    tokens.push({'type': 'Operand', 'value': curr});
                } else {
                    operand += curr;
                }
            }
        }
        if (operand !== '') {
            tokens.push({'type': 'Operand', 'value': operand});
        }
        return tokens;
    }

    function is_parens(input) {
        if (input === '(' || input === ')') {
            return true;
        }
        return false;
    }
}
