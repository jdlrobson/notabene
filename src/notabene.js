// on a blur event fix the title.
$(".note_title").blur(function(ev){
	var val = $(ev.target).val();
	if($.trim(val).length > 0) {
		$(".note_title").attr("disabled", true);
	}
});

// on clicking the "clear" button provide a blank note
$("#newnote").click(function(ev) {
	$(".note_title, .note_text").val("").attr("disabled", false);
});
