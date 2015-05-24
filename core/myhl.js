keyword_table = {
    data_types: ['word', 'number'],
    program_statements: ['print', 'read']
}

compile = function(lines) {
    var variable_table = {};

    parse_declaration = function(line) {
        var parts = line.split(' use as ');
        if (parts.length != 2) {
            throw new Error('Invalid syntax for variable declaration!');
        }

        var type = parts[1].trim();
        if ($.inArray(type, keyword_table.data_types) === -1) {
            throw new Error('Invalid data type ' + type + '!');
        }

        var identifiers = parts[0].split(',');

        for (var i in identifiers) {
            var iden = identifiers[i].trim();
            if (!is_valid_name(iden)) {
                throw new Error('Invalid identifier ' + iden + '!');
            }
            if (variable_table.hasOwnProperty(iden)) {
                throw new Error('Identifier ' + iden + ' was declared more than ones!')
            }

            variable_table[iden] = {
                'type': type,
                'value': ''
            };
        }

        function is_valid_name(name) {
            name = name.trim();
            if (name.length === 0) {
                return false;
            }
            if (''+name.charAt(0).match(/[a-z]|[A-Z]|_/) == null) {
                return false;
            }
            return name.match(/[a-z]|[A-Z]|[0-9]|_/g).length === name.length;
        }
    }


    parse_statement = function(line) {
        var result = null;
        if (is_read_statement(line)) {
            result = read_statement(line);
        } else if (is_print_statement(line)) {
            result = print_statement(line);
        } else if (is_assignment_statement(line)){
            result = 'assignment';
        } else {
            throw new Error('Invalid statement!');
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

        // function is_word(line) {

        // }

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
        }

        function expression_statement(expression) {
            if (is_word(expression) || is_identifier(expression) || is_number_expression(expression)) {
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

execute = function(compiled) {
    var variables = compiled.variable_table;
    var lines = compiled.compiled;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        if (line.type === 'read') {
            execute_read(variables[line.identifier]);
        } else if (line.type === 'print') {
            execute_print(variables[line.identifier]);
        } else {
            // execute_assignment
        }
    }

    function execute_read(variable) {
        var input = prompt('Input ' + variable.type + ':'); // change prompt here!
        if (variable.type === 'number') {
            if (!isNaN(input) && input.length > 0) {
                variable.value = +input;
            } else {
                throw new Error('Type Error: Expected number instead of "' + input + '"');
            }
        } else {
            variable.value = input;
        }
    }

    function execute_print(variable) {
        var to_print = (variable.type === 'number') ? variable.value : "\"" + variable.value + "\"";
        alert(to_print);    // change alert here!
    }
}
