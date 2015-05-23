var editor = {
    textarea: $('textarea'),
    line_numbers: $('.line-numbers'),
    current_line: $('.current-line'),
    initialize: function() {
        editor.textarea.on('input keydown keyup', function() {
            editor.update_line_numbers();
            editor.highlight_line();
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
    }
};

editor.initialize();
