var editor = {
    textarea: $('textarea'),
    line_numbers: $('.line-numbers'),
    current_line: $('.current-line'),
    highlighted: $('pre code'),
    initialize: function() {
        hljs.registerLanguage('myhl', function(hljs) {
            console.log(hljs);
            return {
                keywords: 'var use as read print begin end',
                contains: [
                    {
                        className: 'subkeyword',
                        begin: /\b(statements|vars)\b/
                    },
                    {
                        className: 'operator',
                        begin: /[+*%=-]|([^\/]\/(?!\/))/
                    },
                    hljs.QUOTE_STRING_MODE,
                    hljs.C_LINE_COMMENT_MODE,
                    hljs.C_NUMBER_MODE
                ]
            };
        });

        editor.textarea.on('input keydown keyup', function() {
            editor.update_line_numbers();
            editor.highlight_line();
            editor.highlight_code();
        });
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
        editor.line_numbers.find('span[data-line="' + line + '"]')
            .addClass('current');

        var offset = editor.line_numbers.find('.current').offset().top;
        editor.current_line.offset({ top: offset });
    },
    highlight_code: function() {
        editor.highlighted.text(editor.textarea.val());
        hljs.highlightBlock(editor.highlighted[0]);
    }
};

editor.initialize();
