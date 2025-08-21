$(document).ready(function(){
    
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
                    // $('#success-alert').html('<div class="alert alert-success" role="alert">Artwork authenticated successfully!</div>');
                    setTimeout(
                        function() 
                        {
                            window.location.href = '/admin';
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
                    $('#progressbarstatus').text('COA data saved');
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
            $('#progressbarstatus').text('COA data collected');

            // save all form data
            saveCOADetails(formData);

        }

    });

});