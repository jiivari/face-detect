# face-detect

This project requires a Microsoft Azure API key and Azure subscription:

See Try Cognitive Services for free:
https://azure.microsoft.com/en-us/services/cognitive-services/

Use:

Requires node runtime and node package manager (https://nodejs.org/en/) Requires GIT tools (https://git-scm.com/downloads)

Installation steps:

Install node, npm and git
Clone the repository to local system.
create file "env" to root folder:

```
faceAPIKey=[YOUR KEY]
```

run "npm install" command on api-template folder to install depencies

Run "npm start" to start the service.

Service is started in port 3000

Browse http://localhost:3000


# Face-detect setup
´´´
See folder Postman for template
´´´

1. Create Person Group
    PUT https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/[YOUR GROUP]
    Payload {  "name":"[YOUR GROUP]",    "userData":"[YOUR GROUP NAME]"}


2. Create a person in Group
    POST https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/[YOUR GROUP]/persons
  	payload: {   "name":"[YOUR NAME]", "userData":"[YOUR MESSAGE]" }

3.	Get Person
    GET https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/[YOUR GROUP]/persons/[PERSONID]

4. Post New Face to a person
    POST https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/digia/persons/[PERSONID]/persistedFaces
    Payload: binary

5. Get Training Status
    GET https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/[YOUR GROUP]/training
    
6. Train Group
    POST https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/[YOUR GROUP]/train

7. Get all person from Group
    GET https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/[YOUR GROUP]/persons?top=1000


