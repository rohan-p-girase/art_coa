$(document).ready(function() {

    const searchid = $('#search-id').val();  // Assuming you have an input element with ID 'search-id'

    $("#slideshow > div:gt(0)").hide();

    setInterval(function() {
    $('#slideshow > div:first')
        .fadeOut(1000)
        .next()
        .fadeIn(1000)
        .end()
        .appendTo('#slideshow');
    }, 3000);


});
