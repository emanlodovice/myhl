keyword_table = {
    data_types: ['word', 'number'],
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

    var status = null;
    var has_statement_block = false;
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
                }
            }
        }
    }

    if (status != null) {
        throw new Error('Block not closed!');
    }
    return {variable_table: variable_table}
}