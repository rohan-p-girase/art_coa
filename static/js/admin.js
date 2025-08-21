$(document).ready(function(){

    getSubmissions()
    
    $(function(){
        $('#datepicker').datepicker();
      });

    function formatDate(dateString) {
        var date = new Date(dateString);
        var day = String(date.getDate()).padStart(2, '0');
        var month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
        var year = date.getFullYear();
    
        return month + '/' + day + '/' + year;
    }

    function generateUniqueId() {
        function getRandomNumber(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        const part1 = getRandomNumber(10000, 99999);
        const part2 = getRandomNumber(10000, 99999);
        return `${part1}_${part2}`;
    }

    function getSubmissions(){
        $.ajax({
            url: '/get_submissions',
            method: 'GET',
            dataType: 'json',
            success: function(searches) {
                searches.forEach(function(search) {

                    search.date_completed = formatDate(search.date_completed);
                    // console.log(search.active

                    var rowClasses = "";

                    if(search.active!=0){
                        search.active = 'active';
                        rowClasses = "align-middle cursor search-row";
                    }
                    else {
                        search.active='inactive';
                        rowClasses = "align-middle cursor search-row pe-none";
                    }

                    $('#saved-searches tbody').append(
                        '<tr id="search-'+search.coa_id+'" value="'+search.coa_id+'" class="'+rowClasses+'" role="button" tabindex="0">' +
                        '<th scope="row">'+search.artwork_title+'</td>'+
                        '<td>'+search.date_completed+'</td>'+
                        '<td>'+search.active+'</td>'+
                        '</tr>'
                    );
                
                });
            },
            error: function(response) {
                // alert('Error fetching searches: ' + response.responseJSON.error);
                console.log("no submissions")
            }
        });
    }

    function getRecentSubmission(){
        $.ajax({
            url: '/get_recent_submission',
            method: 'GET',
            dataType: 'json',
            success: function(searches) {
                searches.forEach(function(search) {
                    search.date_completed = formatDate(search.date_completed);
                    var rowClasses = "";
                    if(search.active!=0){
                        search.active = 'active';
                        rowClasses = "align-middle cursor search-row";
                    }
                    else {
                        search.active='inactive';
                        rowClasses = "align-middle cursor search-row pe-none";
                    }
                    $('#saved-searches tbody').append(
                        '<tr id="search-'+search.coa_id+'" value="'+search.coa_id+'" class="'+rowClasses+'" role="button" tabindex="0">' +
                        '<th scope="row">'+search.artwork_title+'</td>'+
                        '<td>'+search.date_completed+'</td>'+
                        '<td>'+search.active+'</td>'+
                        '</tr>'
                    );
                
                });
            },
            error: function(response) {
                // alert('Error fetching searches: ' + response.responseJSON.error);
                console.log("no submissions")
            }
        });
    }

    function displaySubmissionReceipt(){
        $('#new-search-form').empty();
        $('#new-searchLabel').empty();
        $('#new-searchLabel').text("Thank you!");
        html_append = '<div class="card border-0" style="">';
            html_append += '<div class="card-body">';
                html_append += "<h5 class='card-title'>What's Next?</h5>";
                html_append += "<p class='card-text'>Thanks for submitting your COA info! Now it's time for us to get to work.</p>";
                html_append += "<p class='card-text'>An ArtCertique Analyst will take a look your submission as soon as possible.</p>";
                html_append += "<hr>";
                html_append += "<h5 class='card-title fw-bold'>FAQ</h5>";
                html_append += "<p class='card-text fw-bold'>What does the ArtCertique Analyst look for?</p>";
                html_append += "<p class='card-text'>The ArtCertique Analyst looks for various factors including the authenticity of the artwork, the accuracy of the provided details, the provenance, and any signs of forgery or tampering. They also evaluate the artwork's condition and verify its compliance with established standards.</p>";
                html_append += "<p class='card-text fw-bold'>How long does the COA approval process take?</p>";
                html_append += "<p class='card-text'>The COA approval process typically takes between 1-2 days. This duration may vary depending on the complexity of the authentication required and the volume of submissions currently being processed.</p>";
                html_append += "<p class='card-text fw-bold'>If my COA is rejected, can I resubmit?</p>";
                html_append += "<p class='card-text'>Yes, you can resubmit your COA application if it is rejected. However, it is important to address the reasons for rejection provided by the analyst. Ensure that all necessary corrections and additional documentation are included in the resubmission to improve the chances of approval.</p>";
            html_append += '</div>';
        html_append += '</div>';
        $('#new-search-form').append(html_append);
        setTimeout(function(){
            getRecentSubmission()
        }, 2000);
    }
    
    function saveCOAImages(inputFormData){
        
        $.ajax({
            url: '/save_coa_images',  
            type: 'POST',
            data: inputFormData,
            contentType: false,
            processData: false,
            success: function(response) {
                if (response.success) {
                    $('#progressbarstatus').text('');
                    $('#progressbar').addClass('w-100');
                    $('#progressbarstatus').text('COA images saved');
                    setTimeout(function(){
                        displaySubmissionReceipt()
                    }, 2000);
                } else {
                    $('#success-alert').html('<div class="alert alert-danger" role="alert">' + response.error + '</div>');
                }
            },
            error: function(response) {
                $('#success-alert').html('<div class="alert alert-danger" role="alert">An error occurred. Please try again later.</div>');
            }
        });

    }
    
    function saveCOADetails(inputFormData){
        
        $.ajax({
            url: '/save_coa_details',  
            type: 'POST',
            data: inputFormData,
            contentType: false,
            processData: false,
            success: function(response) {
                if (response.success) {
                    saveCOAImages(inputFormData);
                    $('#progressbarstatus').text('');
                    $('#progressbar').addClass('w-75');
                    $('#progressbarstatus').text('saving COA images');
                } else {
                    $('#success-alert').html('<div class="alert alert-danger" role="alert">' + response.error + '</div>');
                }
            },
            error: function(response) {
                $('#success-alert').html('<div class="alert alert-danger" role="alert">An error occurred. Please try again later.</div>');
            }
        });

    }

    // CLICK ON: Submit Artwork Info
    let clickedOnce = false;
    $('#new-search-form').on('submit', function(e) {
        e.preventDefault();

        if (!clickedOnce) {
            $('#submit-coa').text('Click Again to Confirm COA Details');
            clickedOnce = true;
        } else {

            // collect all form data
            var formData = new FormData(this);
            var categories = [];
            $('input[name="categories"]:checked').each(function() {categories.push(this.value);});
            if (categories.length > 0) {
                formData.append('categories', JSON.stringify(categories));
            } else {
                formData.append('categories', '[]');
            }
            var coaID = generateUniqueId();
            formData.append('coa-id', coaID);
            
            $('#progressbardiv').removeClass('d-none');
            $('#progressbarstatus').text('');
            $('#progressbar').addClass('w-50');
            $('#progressbarstatus').text('COA data saved');

            // save all form data
            saveCOADetails(formData);

        }

    });

    $('body').on('click', '.search-row', function() {
        var search_id = $(this).attr('value');
        window.location.href = '/view_search/'+search_id;
    });


    $('#artwork-title').on('input', function() {
        var inputLength = $(this).val().length;
        $('#charCount').text(inputLength+'/80');
    });

});