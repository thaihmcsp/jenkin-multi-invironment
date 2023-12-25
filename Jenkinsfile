def jenkinsENV = "${params.env}"
def tempENV = "dev"
echo "jenkinsENV: ${jenkinsENV}"

if($jenkinsENV == "prod"){
    tempENV = "master"
}

pipeline {
   agent none
   environment {
        ENV = "${tempENV}"
        NODE = "Build-server-multi"
    }

   stages {
    stage('Build Image') {
        agent {
            node {
                label "Build-server-multi"
                customWorkspace "/home/jenkin-multi/build-server-$ENV/"
                }
            }
        environment {
            TAG = sh(returnStdout: true, script: "git rev-parse -short=10 HEAD | tail -n +2").trim()
        }
         steps {
            echo "ENV : $ENV"

            sh "docker build nodejs/. -t multi-env-nodejs-$ENV:latest --build-arg BUILD_ENV=$ENV -f nodejs/Dockerfile"


            sh "cat docker.txt | docker login -u thaihmcsp --password-stdin"
            // tag docker image
            sh "docker tag multi-env-nodejs-$ENV:latest thaihmcsp/nodejs-multi-env:$TAG"

            //push docker image to docker hub
            sh "docker push thaihmcsp/nodejs-multi-env:$TAG"

	    // remove docker image to reduce space on build server	
            sh "docker rmi -f thaihmcsp/nodejs-multi-env:$TAG"

           }
         
       }
	  stage ("Deploy ") {
	    agent {
        node {
            label "Target-Server-multi"
                customWorkspace "/home/jenkin-multi/targer-server-$ENV/"
            }
        }
        environment {
            TAG = sh(returnStdout: true, script: "git rev-parse -short=10 HEAD | tail -n +2").trim()
        }
	steps {
            sh "sed -i 's/{tag}/$TAG/g' /home/jenkin-multi/targer-server-$ENV/docker-compose.yaml"
            sh "docker compose up -d"
        }      
       }
   }
    
}
