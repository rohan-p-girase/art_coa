$(document).ready(function(){

    $('#sign-in').click(function() {
        $('#loginForm').toggleClass('d-none');
        $(this).addClass('d-none');
        $('#sign-up').addClass('d-none');
    });

    $('#sign-up').click(function() {
        $('#signupForm').toggleClass('d-none');
        $('#loginForm').addClass('d-none'); // Hide the login form if visible
        $(this).addClass('d-none');
        $('#sign-in').addClass('d-none');
    });

    $('#loginForm').on('submit', function(e){
        e.preventDefault();
        $.ajax({
            url: '/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                next: $('#next').val(),
                username: $('#username').val(),
                password: $('#password').val()
            }),
            success: function(response){
                if (response.success) {
                    window.location.href = '/admin';
                } else {
                    // Handle the error (e.g., display an error message)
                }
            },
            error: function(response){
                alert(response.responseJSON.error);
            }
        });
    });

    $('#signupForm').on('submit', function(e){
        e.preventDefault();
        var email = $('#email').val();  // Assume the email input has an ID of 'email'
        $.ajax({
            url: '/send_otp',
            method: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            data: {
                email: email
            },
            success: function(response){
                if (response.message) {
                    // Optionally, redirect to a "check your email" page or update UI to indicate the email was sent
                    alert('Please check your email for further instructions');
                }
            },
            error: function(xhr, status, error){
                // Handle the error (e.g., display an error message)
                alert('Error: ' + xhr.responseJSON.error);
            }
        });
    });

});