image := powerplot/webapp
tag   ?= $(shell git rev-parse --short=7 HEAD)

dev-home:
	REACT_APP_SERVER_LOCAL_IP_ADDRESS="10.0.0.99" npm start
 
dev-local:
	REACT_APP_SERVER_LOCAL_IP_ADDRESS="0.0.0.0" npm start

build:
	sudo docker build . \
		-t $(image):0 \
		--build-arg GIT_HASH=$(tag)

build.runtime:
	sudo docker build . \
		-t $(image):0 \
        --target runtime \
		--build-arg GIT_HASH=$(tag)

run:
	sudo docker run \
        -v /home/lukasz/.local/share/powerplot:/home/lukasz/.local/share/powerplot \
        -v /home/lukasz/.config/powerplot:/home/lukasz/.config/powerplot \
        -e SENSOR_SERIAL_NUMBERS=$(SENSOR_SERIAL_NUMBERS) \
		docker.io/$(image):0

tag:
	docker tag $(image):0 "$(image):$(tag)"
