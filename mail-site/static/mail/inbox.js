document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // When the user submits 'compose email' form, send email:
  document.querySelector('form').onsubmit = function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value,
          read: false
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);

    });

    load_mailbox('sent');

  }

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email(recipients='none', subject='none', body='none', timestamp='none') {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email').style.display = 'none';

  // Clear out composition fields
  if (recipients==='none') {
    document.querySelector('#compose-recipients').value = '';
  }
  else {
    document.querySelector('#compose-recipients').value = recipients;

  }

  if (subject==='none') {
    document.querySelector('#compose-subject').value = '';  
  }
  else {
    if (subject === `Re: ${subject}`) {
      document.querySelector('#compose-subject').value = subject;
    }
    else {
      document.querySelector('#compose-subject').value = `Re: ${subject}`;
    }
  }

  if (body === 'none') {
    document.querySelector('#compose-body').value = '';
  }
  else {
    message = `
    -----------------------------------------------
    On ${timestamp} ${recipients} wrote:
    ${body}
    `;
    document.querySelector('#compose-body').value = message;
  }

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);

    // Display sender, subject, and timestamp of email in a div
    for(let i = 0; i < emails.length; i++) {
      const email = document.createElement('div')
      email.innerHTML = `
      <a class='view-email' data-id = '${emails[i].id}'>
        <span class='sender'>${emails[i].sender}</span>
        <span class='subject'>${emails[i].subject}</span>
        <span class='timestamp'>${emails[i].timestamp}</span>
      </a>
      `;        
      if (emails[i].read === false) {
        email.innerHTML = `<div class='unread'>`+email.innerHTML+`</div>`;
      }
      else {
        email.innerHTML = `<div class='inbox-email'>`+email.innerHTML+`</div>`;
      }
      // If email is clicked from inbox, view it
      email.addEventListener('click', () => view_email(emails[i].id));
      document.querySelector('#emails-view').append(email);
    }  

  });

}

function view_email(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email').style.display = 'block';

  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // Print emails
    console.log(email);
    let email_html = `
    <p><b>From:</b> ${email.sender}</p>
    <p><b>To:</b> ${email.recipients}</p>
    <p><b>Subject:</b> ${email.subject}</p>
    <p><b>Timestamp:</b> ${email.timestamp}</p>
    `
    if (email.archived === true) {
      email_html += `<button class="btn btn-sm btn-outline-primary" id="unarchive">Unarchive</button>`
    }
    else {
      email_html += `<button class="btn btn-sm btn-outline-primary" id="archive">Archive</button>`
    }

    email_html += `
    <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
    <hr>
    <p>${email.body}</p>
    `;
    document.querySelector('#single-email').innerHTML = email_html;
    document.querySelector('#reply').addEventListener('click', () => compose_email(email.sender, email.subject, email.body, email.timestamp));

    if (email.archived === false) {
      document.querySelector('#archive').onclick = function() {
        fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: true
          })
        });
        load_mailbox('inbox');
      }
    }
    else {
      document.querySelector('#unarchive').onclick = function() {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
      });
      load_mailbox('inbox');
      }
    }

  });
  
}