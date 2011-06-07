// on a blur event fix the title.
$(".note_title").blur(function(ev){
	var val = $(ev.target).val();
	if($.trim(val).length > 0) {
		$(".note_title").attr("disabled", true);
	}
}).keydown(function(ev) {
	var code = ev.keyCode;
	if(code === 13) {
		$(".note_title").blur();
	}
});
