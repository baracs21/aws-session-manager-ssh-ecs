############################
# STEP 1 build executable binary
############################
FROM golang:1.17-alpine AS builder

# Install git.
# Git is required for fetching the dependencies.
RUN apk update && apk add --no-cache git curl unzip

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    rm -f awscliv2.zip && \
    mv ./aws /aws

ARG GO_WORKDIR

COPY . .

WORKDIR ${GO_WORKDIR}
#RUN go mod download
#RUN go mod verify

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -o /go/bin/app .

############################
# STEP 2 build the image
############################
FROM public.ecr.aws/lts/ubuntu:latest

# Copy our static executable.
COPY --from=builder /go/bin/app /go/bin/app
COPY --from=builder /aws /aws

EXPOSE 8080

RUN apt update && apt install openssh-server curl --no-install-recommends -y

RUN /aws/install

RUN echo "PasswordAuthentication no" >> /etc/ssh/sshd_config
RUN echo "Port 2222" >> /etc/ssh/sshd_config

ADD start.sh /
RUN chmod +x /start.sh

CMD ["/start.sh"]