var editor = {
    textarea: $('textarea'),
    line_numbers: $('.line-numbers'),
    current_line: $('.current-line'),
    highlighted: $('pre code'),
    initialize: function() {
        hljs.registerLanguage('myhl', function(hljs) {
            return {
                keywords: 'var use as read print begin end',
                contains: [
                    {
                        className: 'subkeyword',
                        begin: /\b(statements|vars)\b/
                    },
                    {
                        className: 'operator',
                        begin: /[+*%=-]|(\/(?!\/))/
                    },
                    {
                        className: 'datatype',
                        begin: /\b(number|word)\b/
                    },
                    hljs.QUOTE_STRING_MODE,
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_NUMBER_MODE
                ]
            };
        });

        editor.textarea.on('input keydown keyup', function(e) {
            if (e.keyCode === 9 && e.type === 'keydown') {
                e.preventDefault();
                editor.insert_tab();
            } else {
                editor.update_line_numbers();
                editor.highlight_line();
                editor.highlight_code();
            }
        });

        editor.textarea.on('mousedown mouseup', editor.highlight_line);

        editor.textarea.on('scroll', function(e) {
            editor.highlighted.parent().add(editor.line_numbers)
                .offset({ top: -e.target.scrollTop + 20 });
            editor.highlight_line();
        });
    },
    insert_tab: function() {
        var textarea = editor.textarea[0];
        if (textarea.selectionStart !== undefined) {
            var end = textarea.selectionEnd;
            textarea.value = textarea.value.slice(0, textarea.selectionStart)
                + '    ' + textarea.value.slice(end);
            textarea.selectionStart = end + 4;
            textarea.selectionEnd = end + 4;
        } else {
            textarea.value += '    ';
        }
    },
    update_line_numbers: function() {
        editor.line_numbers.empty();
        var lines = editor.textarea.val().split(/\r?\n/g).length;
        var template = '<span data-line="#{i}">#{i}</span>';
        while (lines) {
            editor.line_numbers.prepend(template.replace(/#\{i\}/g, lines--));
        }
    },
    highlight_line: function() {
        var contents = editor.textarea.val();
        var line = contents.substring(0, editor.textarea[0].selectionStart)
            .split(/\r?\n/g).length;
        editor.line_numbers.find('span').removeClass('current');
        editor.line_numbers.find('span[data-line="' + line + '"]')
            .addClass('current');

        var offset = editor.line_numbers.find('.current').offset().top;
        editor.current_line.offset({ top: offset });
    },
    highlight_code: function() {
        editor.highlighted.text(editor.textarea.val());
        hljs.highlightBlock(editor.highlighted[0]);
    },
    update_content: function(content) {
        editor.textarea.val(content);
        editor.textarea.trigger('input');
    }
};


var actions = {
    container: $('nav'),
    file: $('input[type="file"]'),
    initialize: function() {
        actions.container.on('click', 'a[data-action]', function(e) {
            e.preventDefault();
            var target = $(this);
            if (target.data('action') === 'file') {
                actions.open_file();
            } else if (target.data('action') === 'compile') {
                actions.compile();
            } else if (target.data('action') === 'execute') {
                actions.execute();
            }
        });

        $(document).on('keydown', function(e) {
            if (e.keyCode === 79 && e.ctrlKey) {
                e.preventDefault();
                actions.open_file();
            } else if (e.keyCode === 50 && e.ctrlKey) {
                e.preventDefault();
                actions.compile();
            } else if (e.keyCode === 51 && e.ctrlKey) {
                e.preventDefault();
                actions.execute();
            }
        });
    },
    open_file: function() {
        actions.file.trigger('click');
        actions.file.off('change').on('change', function() {
            var reader = new FileReader();
            reader.onload = function(e) {
                editor.update_content(e.target.result);
            }
            reader.readAsText(this.files[0])
        });
    },
    compile: function() {
        var lines = editor.textarea.val().trim()
            .replace(/(\r?\n)+/g, '\r\n').split(/\r?\n/);
        konsole.open().clear().info('Compiling MyHL code.');
        var start = (new Date()).valueOf();
        try {
            var output = compile(lines);
            var end = (new Date()).valueOf();
            var time = (end - start) / 1000;
            konsole.info('Done after ' + time + ' seconds.');
            return output;
        } catch (e) {
            konsole.error(e.message);
            return false;
        }
    },
    execute: function() {
        var compiled = actions.compile();
        if (compiled) {
            setTimeout(function() {
                konsole.clear().info('Executing MyHL code.');
                var start = (new Date()).valueOf();
                try {
                    execute(compiled);
                    var end = (new Date()).valueOf();
                    var time = (end - start) / 1000;
                    konsole.info('Done after ' + time + ' seconds.');
                } catch (e) {
                    konsole.error(e.message);
                }
            }, 500);
        }
    }
};


var konsole = {
    container: $('.console'),
    logs: $('.console .logs'),
    input: $('.console input[type="text"]'),
    template: '<p class="#{type}">#{message}</p>',
    initialize: function() {
        konsole.input.on('keydown', function(e) {
            if (e.keyCode === 27) {
                konsole.close().clear();
            }
        });

        konsole.container.on('mouseup', function() {
            konsole.input.trigger('focus');
        });
    },
    open: function() {
        konsole.container.removeClass('hidden');
        editor.textarea.addClass('collapsed');
        setTimeout(function() {
            konsole.input.trigger('focus');
        }, 150);
        return konsole;
    },
    close: function() {
        konsole.container.addClass('hidden');
        editor.textarea.removeClass('collapsed');
        editor.textarea.trigger('focus');
        return konsole;
    },
    clear: function() {
        konsole.logs.empty();
        konsole.input.val('');
        return konsole;
    },
    log: function(message, type) {
        type = type || '';
        var log = konsole.template.replace(/#\{message\}/g, message)
            .replace(/#\{type\}/, type);
        konsole.logs.append(log)[0].scrollTop = konsole.logs[0].scrollHeight;
    },
    info: function(message) {
        konsole.log(message, 'info');
    },
    error: function(message) {
        konsole.log(message, 'error');
    }
};



editor.initialize();
actions.initialize();
konsole.initialize();
