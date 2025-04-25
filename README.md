# Real-Time Benchmark

A performance benchmarking tool that compares latency and reliability between AWS AppSync Events and Momento Topics for real-time messaging.

## Overview

This project provides infrastructure and tooling to measure and compare the performance characteristics of two real-time communication solutions:
- AWS AppSync Events
- Momento Topics

## Features

- Concurrent WebSocket connection testing
- Latency measurements for message delivery
- Error rate tracking
- CloudWatch metrics integration
- Containerized benchmark runner using ECS Fargate

## Prerequisites

- AWS Account
- AWS SAM CLI
- Node.js 20.x
- Docker
- Momento API Key
- WebSocket API Key

## Infrastructure

The project deploys the following AWS resources:
- AppSync API with Event subscriptions
- Lambda functions for publishing messages and recording metrics
- ECS Fargate cluster for running benchmarks
- VPC with public subnets
- ECR repository
- CloudWatch metrics

## Deployment

Use the below commands to deploy the resources into your AWS account

```bash
sam build
sam deploy --guided
```

### Configuration
The following environment variables are required:

* `MOMENTO_API_KEY`: Your Momento API key
* `WS_API_KEY`: WebSocket API key for AppSync

## Monitoring
Metrics are available in CloudWatch under:

* **Namespace**: ReadySetCloud
* **Service Name**: RealTime

Available metrics:

* Latency (milliseconds)
* Error count
