---
url: https://replicate.com/docs/reference/http
title: HTTP API - Replicate docs
description: The API documentation for the API.
access_date: 2025-07-18T09:15:07.000Z
current_date: 2025-07-18T09:15:07.713Z
---

Docs

 Home / Reference 

#  HTTP API 

The API documentation for the API.

Copy page

---

Authentication

`predictions.create` \- Create a prediction

`predictions.get` \- Get a prediction

`predictions.list` \- List predictions

`predictions.cancel` \- Cancel a prediction

`models.create` \- Create a model

`models.get` \- Get a model

`models.list` \- List public models

`models.search` \- Search public models

`models.delete` \- Delete a model

`models.examples.list` \- List examples for a model

`models.predictions.create` \- Create a prediction using an official model

`models.readme.get` \- Get a model's README

`models.versions.get` \- Get a model version

`models.versions.list` \- List model versions

`models.versions.delete` \- Delete a model version

`collections.get` \- Get a collection of models

`collections.list` \- List collections of models

`deployments.create` \- Create a deployment

`deployments.get` \- Get a deployment

`deployments.list` \- List deployments

`deployments.update` \- Update a deployment

`deployments.delete` \- Delete a deployment

`deployments.predictions.create` \- Create a prediction using a deployment

`files.list` \- List files

`files.create` \- Create a file

`files.delete` \- Delete a file

`files.get` \- Get a file

`files.download` \- Download a file

`trainings.create` \- Create a training

`trainings.get` \- Get a training

`trainings.list` \- List trainings

`trainings.cancel` \- Cancel a training

`hardware.list` \- List available hardware for models

`account.get` \- Get the authenticated account

`webhooks.default.secret.get` \- Get the signing secret for the default webhook

## Authentication

All API requests must include a valid API token in the `Authorization` request header. The token must be prefixed by “Bearer”, followed by a space and the token value. Example: `Authorization: Bearer r8_Hw***********************************`Find your tokens at https://replicate.com/account/api-tokens

## Create a prediction

### Endpoint

Copy 

```
POST https://api.replicate.com/v1/predictions
```

### Description

Create a prediction for the model version and inputs you provide.

If you’re running an official model, use the `models.predictions.create` operation instead.

Example cURL request:

Copy 

```
curl -s -X POST -H 'Prefer: wait' \
  -d '{"version": "replicate/hello-world:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa", "input": {"text": "Alice"}}' \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H 'Content-Type: application/json' \
  https://api.replicate.com/v1/predictions
```

The request will wait up to 60 seconds for the model to run. If this time is exceeded the prediction will be returned in a `"starting"` state and need to be retrieved using the `predictions.get` endpiont.

For a complete overview of the `predictions.create` API check out our documentation on creating a prediction which covers a variety of use cases.

### Headers

* Preferstring  
Leave the request open and wait for the model to finish generating output. Set to `wait=n` where n is a number of seconds between 1 and 60.  
See https://replicate.com/docs/topics/predictions/create-a-prediction#sync-mode for more information.

### Request Body

* inputobjectRequired  
The model's input as a JSON object. The input schema depends on what model you are running. To see the available inputs, click the "API" tab on the model you are running or get the model version and look at its `openapi_schema` property. For example, stability-ai/sdxl takes `prompt` as an input.  
Files should be passed as HTTP URLs or data URLs.  
Use an HTTP URL when:  
   * you have a large file > 256kb  
   * you want to be able to use the file multiple times  
   * you want your prediction metadata to be associable with your input files  
Use a data URL when:  
   * you have a small file <= 256kb  
   * you don't want to upload and host the file somewhere  
   * you don't need to use the file again (Replicate will not store it)
* versionstringRequired  
The ID of the model version that you want to run. This can be specified in two formats:  
   1. Just the 64-character version ID: `9dcd6d78e7c6560c340d916fe32e9f24aabfa331e5cce95fe31f77fb03121426`  
   2. Full model identifier with version ID in the format `{owner}/{model}:{id}`. For example, `replicate/hello-world:9dcd6d78e7c6560c340d916fe32e9f24aabfa331e5cce95fe31f77fb03121426`
* streamboolean  
**This field is deprecated.**  
Request a URL to receive streaming output using server-sent events (SSE).  
This field is no longer needed as the returned prediction will always have a `stream` entry in its `url` property if the model supports streaming.
* webhookstring  
An HTTPS URL for receiving a webhook when the prediction has new output. The webhook will be a POST request where the request body is the same as the response body of the get prediction operation. If there are network problems, we will retry the webhook a few times, so make sure it can be safely called more than once. Replicate will not follow redirects when sending webhook requests to your service, so be sure to specify a URL that will resolve without redirecting.
* webhook\_events\_filterarray  
By default, we will send requests to your webhook URL whenever there are new outputs or the prediction has finished. You can change which events trigger webhook requests by specifying `webhook_events_filter` in the prediction request:  
   * `start`: immediately on prediction start  
   * `output`: each time a prediction generates an output (note that predictions can generate multiple outputs)  
   * `logs`: each time log output is generated by a prediction  
   * `completed`: when the prediction reaches a terminal state (succeeded/canceled/failed)  
For example, if you only wanted requests to be sent at the start and end of the prediction, you would provide:  
```  
{  
  "version": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",  
  "input": {  
    "text": "Alice"  
  },  
  "webhook": "https://example.com/my-webhook",  
  "webhook_events_filter": ["start", "completed"]  
}  
```  
Requests for event types `output` and `logs` will be sent at most once every 500ms. If you request `start` and `completed` webhooks, then they'll always be sent regardless of throttling.

## Get a prediction

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/predictions/{prediction_id}
```

### Description

Get the current state of a prediction.

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/predictions/gm3qorzdhgbfurvjtvhg6dckhu
```

The response will be the prediction object:

Copy 

```
{
  "id": "gm3qorzdhgbfurvjtvhg6dckhu",
  "model": "replicate/hello-world",
  "version": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
  "input": {
    "text": "Alice"
  },
  "logs": "",
  "output": "hello Alice",
  "error": null,
  "status": "succeeded",
  "created_at": "2023-09-08T16:19:34.765994Z",
  "data_removed": false,
  "started_at": "2023-09-08T16:19:34.779176Z",
  "completed_at": "2023-09-08T16:19:34.791859Z",
  "metrics": {
    "predict_time": 0.012683
  },
  "urls": {
    "web": "https://replicate.com/p/gm3qorzdhgbfurvjtvhg6dckhu",
    "get": "https://api.replicate.com/v1/predictions/gm3qorzdhgbfurvjtvhg6dckhu",
    "cancel": "https://api.replicate.com/v1/predictions/gm3qorzdhgbfurvjtvhg6dckhu/cancel"
  }
}
```

`status` will be one of:

* `starting`: the prediction is starting up. If this status lasts longer than a few seconds, then it’s typically because a new worker is being started to run the prediction.
* `processing`: the `predict()` method of the model is currently running.
* `succeeded`: the prediction completed successfully.
* `failed`: the prediction encountered an error during processing.
* `canceled`: the prediction was canceled by its creator.

In the case of success, `output` will be an object containing the output of the model. Any files will be represented as HTTPS URLs. You’ll need to pass the `Authorization` header to request them.

In the case of failure, `error` will contain the error encountered during the prediction.

Terminated predictions (with a status of `succeeded`, `failed`, or `canceled`) will include a `metrics` object with a `predict_time` property showing the amount of CPU or GPU time, in seconds, that the prediction used while running. It won’t include time waiting for the prediction to start.

All input parameters, output values, and logs are automatically removed after an hour, by default, for predictions created through the API.

You must save a copy of any data or files in the output if you’d like to continue using them. The `output` key will still be present, but it’s value will be `null` after the output has been removed.

Output files are served by `replicate.delivery` and its subdomains. If you use an allow list of external domains for your assets, add `replicate.delivery` and `*.replicate.delivery` to it.

### URL Parameters

* prediction\_idstringRequired  
The ID of the prediction to get.

## List predictions

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/predictions
```

### Description

Get a paginated list of all predictions created by the user or organization associated with the provided API token.

This will include predictions created from the API and the website. It will return 100 records per page.

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/predictions
```

The response will be a paginated JSON array of prediction objects, sorted with the most recent prediction first:

Copy 

```
{
  "next": null,
  "previous": null,
  "results": [
    {
      "completed_at": "2023-09-08T16:19:34.791859Z",
      "created_at": "2023-09-08T16:19:34.907244Z",
      "data_removed": false,
      "error": null,
      "id": "gm3qorzdhgbfurvjtvhg6dckhu",
      "input": {
        "text": "Alice"
      },
      "metrics": {
        "predict_time": 0.012683
      },
      "output": "hello Alice",
      "started_at": "2023-09-08T16:19:34.779176Z",
      "source": "api",
      "status": "succeeded",
      "urls": {
        "web": "https://replicate.com/p/gm3qorzdhgbfurvjtvhg6dckhu",
        "get": "https://api.replicate.com/v1/predictions/gm3qorzdhgbfurvjtvhg6dckhu",
        "cancel": "https://api.replicate.com/v1/predictions/gm3qorzdhgbfurvjtvhg6dckhu/cancel"
      },
      "model": "replicate/hello-world",
      "version": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
    }
  ]
}
```

`id` will be the unique ID of the prediction.

`source` will indicate how the prediction was created. Possible values are `web` or `api`.

`status` will be the status of the prediction. Refer to get a single prediction for possible values.

`urls` will be a convenience object that can be used to construct new API requests for the given prediction. If the requested model version supports streaming, this will have a `stream` entry with an HTTPS URL that you can use to construct an `EventSource`.

`model` will be the model identifier string in the format of `{model_owner}/{model_name}`.

`version` will be the unique ID of model version used to create the prediction.

`data_removed` will be `true` if the input and output data has been deleted.

### Query Parameters

* created\_afterstring  
Include only predictions created at or after this date-time, in ISO 8601 format.
* created\_beforestring  
Include only predictions created before this date-time, in ISO 8601 format.

## Cancel a prediction

### Endpoint

Copy 

```
POST https://api.replicate.com/v1/predictions/{prediction_id}/cancel
```

### Description

Cancel a prediction that is currently running.

Example cURL request that creates a prediction and then cancels it:

Copy 

```
# First, create a prediction
PREDICTION_ID=$(curl -s -X POST \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "a video that may take a while to generate"
    }
  }' \
  https://api.replicate.com/v1/models/minimax/video-01/predictions | jq -r '.id')

# Echo the prediction ID
echo "Created prediction with ID: $PREDICTION_ID"

# Cancel the prediction
curl -s -X POST \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/predictions/$PREDICTION_ID/cancel
```

* prediction\_idstringRequired  
The ID of the prediction to cancel.

## Create a model

### Endpoint

Copy 

```
POST https://api.replicate.com/v1/models
```

### Description

Create a model.

Copy 

```
curl -s -X POST \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"owner": "alice", "name": "hot-dog-detector", "description": "Detect hot dogs in images", "visibility": "public", "hardware": "cpu"}' \
  https://api.replicate.com/v1/models
```

The response will be a model object in the following format:

Copy 

```
{
  "url": "https://replicate.com/alice/hot-dog-detector",
  "owner": "alice",
  "name": "hot-dog-detector",
  "description": "Detect hot dogs in images",
  "visibility": "public",
  "github_url": null,
  "paper_url": null,
  "license_url": null,
  "run_count": 0,
  "cover_image_url": null,
  "default_example": null,
  "latest_version": null,
}
```

Note that there is a limit of 1,000 models per account. For most purposes, we recommend using a single model and pushing new versions of the model as you make changes to it.

### Request Body

* hardwarestringRequired  
The SKU for the hardware used to run the model. Possible values can be retrieved from the `hardware.list` endpoint.
* namestringRequired  
The name of the model. This must be unique among all models owned by the user or organization.
* ownerstringRequired  
The name of the user or organization that will own the model. This must be the same as the user or organization that is making the API request. In other words, the API token used in the request must belong to this user or organization.
* visibilitystringRequired  
Whether the model should be public or private. A public model can be viewed and run by anyone, whereas a private model can be viewed and run only by the user or organization members that own the model.
* cover\_image\_urlstring  
A URL for the model's cover image. This should be an image file.
* descriptionstring  
A description of the model.
* github\_urlstring  
A URL for the model's source code on GitHub.
* license\_urlstring  
A URL for the model's license.
* paper\_urlstring  
A URL for the model's paper.

## Get a model

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/models/{model_owner}/{model_name}
```

### Description

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/models/replicate/hello-world
```

Copy 

```
{
  "url": "https://replicate.com/replicate/hello-world",
  "owner": "replicate",
  "name": "hello-world",
  "description": "A tiny model that says hello",
  "visibility": "public",
  "github_url": "https://github.com/replicate/cog-examples",
  "paper_url": null,
  "license_url": null,
  "run_count": 5681081,
  "cover_image_url": "...",
  "default_example": {...},
  "latest_version": {...},
}
```

The model object includes the input and output schema for the latest version of the model.

Here’s an example showing how to fetch the model with cURL and display its input schema with jq:

Copy 

```
curl -s \
    -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
    https://api.replicate.com/v1/models/replicate/hello-world \
    | jq ".latest_version.openapi_schema.components.schemas.Input"
```

This will return the following JSON object:

Copy 

```
{
  "type": "object",
  "title": "Input",
  "required": [
    "text"
  ],
  "properties": {
    "text": {
      "type": "string",
      "title": "Text",
      "x-order": 0,
      "description": "Text to prefix with 'hello '"
    }
  }
}
```

The `cover_image_url` string is an HTTPS URL for an image file. This can be:

* An image uploaded by the model author.
* The output file of the example prediction, if the model author has not set a cover image.
* The input file of the example prediction, if the model author has not set a cover image and the example prediction has no output file.
* A generic fallback image.

The `default_example` object is a prediction created with this model.

The `latest_version` object is the model’s most recently pushed version.

* model\_ownerstringRequired  
The name of the user or organization that owns the model.
* model\_namestringRequired  
The name of the model.

## List public models

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/models
```

### Description

Get a paginated list of public models.

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/models
```

The response will be a pagination object containing a list of model objects.

See the `models.get` docs for more details about the model object.

## Search public models

### Endpoint

Copy 

```
QUERY https://api.replicate.com/v1/models
```

### Description

Get a list of public models matching a search query.

Copy 

```
curl -s -X QUERY \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: text/plain" \
  -d "hello" \
  https://api.replicate.com/v1/models
```

The response will be a paginated JSON object containing an array of model objects.

## Delete a model

### Endpoint

Copy 

```
DELETE https://api.replicate.com/v1/models/{model_owner}/{model_name}
```

### Description

Delete a model

Model deletion has some restrictions:

* You can only delete models you own.
* You can only delete private models.
* You can only delete models that have no versions associated with them. Currently you’ll need to delete the model’s versions before you can delete the model itself.

Copy 

```
curl -s -X DELETE \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/models/replicate/hello-world
```

The response will be an empty 204, indicating the model has been deleted.

## List examples for a model

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/models/{model_owner}/{model_name}/examples
```

### Description

List example predictions made using the model. These are predictions that were saved by the model author as illustrative examples of the model’s capabilities.

If you want all the examples for a model, use this operation.

If you just want the model’s default example, you can use the `models.get` operation instead, which includes a `default_example` object.

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/models/replicate/hello-world/examples
```

The response will be a pagination object containing a list of example predictions:

Copy 

```
{
  "next": "https://api.replicate.com/v1/models/replicate/hello-world/examples?cursor=...",
  "previous": "https://api.replicate.com/v1/models/replicate/hello-world/examples?cursor=...",
  "results": [...]
}
```

Each item in the `results` list is a prediction object.

## Create a prediction using an official model

### Endpoint

Copy 

```
POST https://api.replicate.com/v1/models/{model_owner}/{model_name}/predictions
```

### Description

Create a prediction using an official model.

If you’re _not_ running an official model, use the `predictions.create` operation instead.

Copy 

```
curl -s -X POST -H 'Prefer: wait' \
  -d '{"input": {"prompt": "Write a short poem about the weather."}}' \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H 'Content-Type: application/json' \
  https://api.replicate.com/v1/models/meta/meta-llama-3-70b-instruct/predictions
```

For a complete overview of the `deployments.predictions.create` API check out our documentation on creating a prediction which covers a variety of use cases.

### Headers

### Request Body

* inputobjectRequired  
The model's input as a JSON object. The input schema depends on what model you are running. To see the available inputs, click the "API" tab on the model you are running or get the model version and look at its `openapi_schema` property. For example, stability-ai/sdxl takes `prompt` as an input.  
Files should be passed as HTTP URLs or data URLs.  
Use an HTTP URL when:  
   * you have a large file > 256kb  
   * you want to be able to use the file multiple times  
   * you want your prediction metadata to be associable with your input files  
Use a data URL when:  
   * you have a small file <= 256kb  
   * you don't want to upload and host the file somewhere  
   * you don't need to use the file again (Replicate will not store it)
* streamboolean  
**This field is deprecated.**  
Request a URL to receive streaming output using server-sent events (SSE).  
This field is no longer needed as the returned prediction will always have a `stream` entry in its `url` property if the model supports streaming.
* webhookstring  
An HTTPS URL for receiving a webhook when the prediction has new output. The webhook will be a POST request where the request body is the same as the response body of the get prediction operation. If there are network problems, we will retry the webhook a few times, so make sure it can be safely called more than once. Replicate will not follow redirects when sending webhook requests to your service, so be sure to specify a URL that will resolve without redirecting.
* webhook\_events\_filterarray  
By default, we will send requests to your webhook URL whenever there are new outputs or the prediction has finished. You can change which events trigger webhook requests by specifying `webhook_events_filter` in the prediction request:  
   * `start`: immediately on prediction start  
   * `output`: each time a prediction generates an output (note that predictions can generate multiple outputs)  
   * `logs`: each time log output is generated by a prediction  
   * `completed`: when the prediction reaches a terminal state (succeeded/canceled/failed)  
For example, if you only wanted requests to be sent at the start and end of the prediction, you would provide:  
```  
{  
  "input": {  
    "text": "Alice"  
  },  
  "webhook": "https://example.com/my-webhook",  
  "webhook_events_filter": ["start", "completed"]  
}  
```  
Requests for event types `output` and `logs` will be sent at most once every 500ms. If you request `start` and `completed` webhooks, then they'll always be sent regardless of throttling.

## Get a model’s README

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/models/{model_owner}/{model_name}/readme
```

### Description

Get the README content for a model.

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/models/replicate/hello-world/readme
```

The response will be the README content as plain text in Markdown format:

Copy 

```
# Hello World Model

This is an example model that...
```

## Get a model version

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/models/{model_owner}/{model_name}/versions/{version_id}
```

### Description

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/models/replicate/hello-world/versions/5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa
```

The response will be the version object:

Copy 

```
{
  "id": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
  "created_at": "2022-04-26T19:29:04.418669Z",
  "cog_version": "0.3.0",
  "openapi_schema": {...}
}
```

Every model describes its inputs and outputs with OpenAPI Schema Objects in the `openapi_schema` property.

The `openapi_schema.components.schemas.Input` property for the replicate/hello-world model looks like this:

Copy 

```
{
  "type": "object",
  "title": "Input",
  "required": [
    "text"
  ],
  "properties": {
    "text": {
      "x-order": 0,
      "type": "string",
      "title": "Text",
      "description": "Text to prefix with 'hello '"
    }
  }
}
```

The `openapi_schema.components.schemas.Output` property for the replicate/hello-world model looks like this:

Copy 

```
{
  "type": "string",
  "title": "Output"
}
```

For more details, see the docs on Cog’s supported input and output types

* model\_ownerstringRequired  
The name of the user or organization that owns the model.
* model\_namestringRequired  
The name of the model.
* version\_idstringRequired  
The ID of the version.

## List model versions

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/models/{model_owner}/{model_name}/versions
```

### Description

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/models/replicate/hello-world/versions
```

The response will be a JSON array of model version objects, sorted with the most recent version first:

Copy 

```
{
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
      "created_at": "2022-04-26T19:29:04.418669Z",
      "cog_version": "0.3.0",
      "openapi_schema": {...}
    }
  ]
}
```

## Delete a model version

### Endpoint

Copy 

```
DELETE https://api.replicate.com/v1/models/{model_owner}/{model_name}/versions/{version_id}
```

### Description

Delete a model version and all associated predictions, including all output files.

Model version deletion has some restrictions:

* You can only delete versions from models you own.
* You can only delete versions from private models.
* You cannot delete a version if someone other than you has run predictions with it.
* You cannot delete a version if it is being used as the base model for a fine tune/training.
* You cannot delete a version if it has an associated deployment.
* You cannot delete a version if another model version is overridden to use it.

Copy 

```
curl -s -X DELETE \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/models/replicate/hello-world/versions/5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa
```

The response will be an empty 202, indicating the deletion request has been accepted. It might take a few minutes to be processed.

## Get a collection of models

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/collections/{collection_slug}
```

### Description

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/collections/super-resolution
```

The response will be a collection object with a nested list of the models in that collection:

Copy 

```
{
  "name": "Super resolution",
  "slug": "super-resolution",
  "description": "Upscaling models that create high-quality images from low-quality images.",
  "models": [...]
}
```

* collection\_slugstringRequired  
The slug of the collection, like `super-resolution` or `image-restoration`. See replicate.com/collections.

## List collections of models

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/collections
```

### Description

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/collections
```

The response will be a paginated JSON list of collection objects:

Copy 

```
{
  "next": "null",
  "previous": null,
  "results": [
    {
      "name": "Super resolution",
      "slug": "super-resolution",
      "description": "Upscaling models that create high-quality images from low-quality images."
    }
  ]
}
```

## Create a deployment

### Endpoint

Copy 

```
POST https://api.replicate.com/v1/deployments
```

### Description

Create a new deployment:

Copy 

```
curl -s \
  -X POST \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "my-app-image-generator",
        "model": "stability-ai/sdxl",
        "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
        "hardware": "gpu-t4",
        "min_instances": 0,
        "max_instances": 3
      }' \
  https://api.replicate.com/v1/deployments
```

The response will be a JSON object describing the deployment:

Copy 

```
{
  "owner": "acme",
  "name": "my-app-image-generator",
  "current_release": {
    "number": 1,
    "model": "stability-ai/sdxl",
    "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
    "created_at": "2024-02-15T16:32:57.018467Z",
    "created_by": {
      "type": "organization",
      "username": "acme",
      "name": "Acme Corp, Inc.",
      "avatar_url": "https://cdn.replicate.com/avatars/acme.png",
      "github_url": "https://github.com/acme"
    },
    "configuration": {
      "hardware": "gpu-t4",
      "min_instances": 1,
      "max_instances": 5
    }
  }
}
```

### Request Body

* hardwarestringRequired  
The SKU for the hardware used to run the model. Possible values can be retrieved from the `hardware.list` endpoint.
* max\_instancesintegerRequired  
The maximum number of instances for scaling.
* min\_instancesintegerRequired  
The minimum number of instances for scaling.
* modelstringRequired  
The full name of the model that you want to deploy e.g. stability-ai/sdxl.
* namestringRequired  
The name of the deployment.
* versionstringRequired  
The 64-character string ID of the model version that you want to deploy.

## Get a deployment

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/deployments/{deployment_owner}/{deployment_name}
```

### Description

Get information about a deployment by name including the current release.

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/deployments/replicate/my-app-image-generator
```

Copy 

* deployment\_ownerstringRequired  
The name of the user or organization that owns the deployment.
* deployment\_namestringRequired  
The name of the deployment.

## List deployments

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/deployments
```

### Description

Get a list of deployments associated with the current account, including the latest release configuration for each deployment.

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/deployments
```

The response will be a paginated JSON array of deployment objects, sorted with the most recent deployment first:

Copy 

```
{
  "next": "http://api.replicate.com/v1/deployments?cursor=cD0yMDIzLTA2LTA2KzIzJTNBNDAlM0EwOC45NjMwMDAlMkIwMCUzQTAw",
  "previous": null,
  "results": [
    {
      "owner": "replicate",
      "name": "my-app-image-generator",
      "current_release": {
        "number": 1,
        "model": "stability-ai/sdxl",
        "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
        "created_at": "2024-02-15T16:32:57.018467Z",
        "created_by": {
          "type": "organization",
          "username": "acme",
          "name": "Acme Corp, Inc.",
          "avatar_url": "https://cdn.replicate.com/avatars/acme.png",
          "github_url": "https://github.com/acme"
        },
        "configuration": {
          "hardware": "gpu-t4",
          "min_instances": 1,
          "max_instances": 5
        }
      }
    }
  ]
}
```

## Update a deployment

### Endpoint

Copy 

```
PATCH https://api.replicate.com/v1/deployments/{deployment_owner}/{deployment_name}
```

### Description

Update properties of an existing deployment, including hardware, min/max instances, and the deployment’s underlying model version.

Copy 

```
curl -s \
  -X PATCH \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"min_instances": 3, "max_instances": 10}' \
  https://api.replicate.com/v1/deployments/acme/my-app-image-generator
```

Copy 

```
{
  "owner": "acme",
  "name": "my-app-image-generator",
  "current_release": {
    "number": 2,
    "model": "stability-ai/sdxl",
    "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
    "created_at": "2024-02-15T16:32:57.018467Z",
    "created_by": {
      "type": "organization",
      "username": "acme",
      "name": "Acme Corp, Inc.",
      "avatar_url": "https://cdn.replicate.com/avatars/acme.png",
      "github_url": "https://github.com/acme"
    },
    "configuration": {
      "hardware": "gpu-t4",
      "min_instances": 3,
      "max_instances": 10
    }
  }
}
```

Updating any deployment properties will increment the `number` field of the `current_release`.

### Request Body

* hardwarestring  
The SKU for the hardware used to run the model. Possible values can be retrieved from the `hardware.list` endpoint.
* max\_instancesinteger  
The maximum number of instances for scaling.
* min\_instancesinteger  
The minimum number of instances for scaling.
* versionstring  
The ID of the model version that you want to deploy

## Delete a deployment

### Endpoint

Copy 

```
DELETE https://api.replicate.com/v1/deployments/{deployment_owner}/{deployment_name}
```

### Description

Delete a deployment

Deployment deletion has some restrictions:

* You can only delete deployments that have been offline and unused for at least 15 minutes.

Copy 

```
curl -s -X DELETE \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/deployments/acme/my-app-image-generator
```

The response will be an empty 204, indicating the deployment has been deleted.

## Create a prediction using a deployment

### Endpoint

Copy 

```
POST https://api.replicate.com/v1/deployments/{deployment_owner}/{deployment_name}/predictions
```

### Description

Create a prediction for the deployment and inputs you provide.

Copy 

```
curl -s -X POST -H 'Prefer: wait' \
  -d '{"input": {"prompt": "A photo of a bear riding a bicycle over the moon"}}' \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H 'Content-Type: application/json' \
  https://api.replicate.com/v1/deployments/acme/my-app-image-generator/predictions
```

### Headers

### Request Body

## List files

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/files
```

### Description

Get a paginated list of all files created by the user or organization associated with the provided API token.

Copy 

```
curl -s \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/files
```

The response will be a paginated JSON array of file objects, sorted with the most recent file first.

## Create a file

### Endpoint

Copy 

```
POST https://api.replicate.com/v1/files
```

### Description

Create a file by uploading its content and optional metadata.

Copy 

```
curl -X POST https://api.replicate.com/v1/files \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -H 'Content-Type: multipart/form-data' \
  -F 'content=@/path/to/archive.zip;type=application/zip;filename=example.zip' \
  -F 'metadata={"customer_reference_id": 123};type=application/json'
```

The request must include:

* `content`: The file content (required)
* `type`: The content / MIME type for the file (defaults to `application/octet-stream`)
* `filename`: The filename (required, ≤ 255 bytes, valid UTF-8)
* `metadata`: User-provided metadata associated with the file (defaults to `{}`, must be valid JSON)

## Delete a file

### Endpoint

Copy 

```
DELETE https://api.replicate.com/v1/files/{file_id}
```

### Description

Delete a file. Once a file has been deleted, subsequent requests to the file resource return 404 Not found.

Copy 

```
curl -X DELETE \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/files/cneqzikepnug6xezperrr4z55o
```

* file\_idstringRequired  
The ID of the file to delete

## Get a file

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/files/{file_id}
```

### Description

Get the details of a file.

Copy 

```
curl -s \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/files/cneqzikepnug6xezperrr4z55o
```

* file\_idstringRequired  
The ID of the file to get

## Download a file

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/files/{file_id}/download
```

### Description

Download a file by providing the file owner, access expiry, and a valid signature.

Copy 

```
curl -X GET "https://api.replicate.com/v1/files/cneqzikepnug6xezperrr4z55o/download?expiry=1708515345&owner=mattt&signature=zuoghqlrcnw8YHywkpaXQlHsVhWen%2FDZ4aal76dLiOo%3D"
```

* file\_idstringRequired  
The ID of the file to download

* ownerstringRequired  
The username of the user or organization that uploaded the file
* expiryintegerRequired  
A Unix timestamp with expiration date of this download URL
* signaturestringRequired  
A base64-encoded HMAC-SHA256 checksum of the string '{owner} {id} {expiry}' generated with the Files API signing secret

## Create a training

### Endpoint

Copy 

```
POST https://api.replicate.com/v1/models/{model_owner}/{model_name}/versions/{version_id}/trainings
```

### Description

Start a new training of the model version you specify.

Example request body:

Copy 

```
{
  "destination": "{new_owner}/{new_name}",
  "input": {
    "train_data": "https://example.com/my-input-images.zip",
  },
  "webhook": "https://example.com/my-webhook",
}
```

Copy 

```
curl -s -X POST \
  -d '{"destination": "{new_owner}/{new_name}", "input": {"input_images": "https://example.com/my-input-images.zip"}}' \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H 'Content-Type: application/json' \
  https://api.replicate.com/v1/models/stability-ai/sdxl/versions/da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf/trainings
```

The response will be the training object:

Copy 

```
{
  "id": "zz4ibbonubfz7carwiefibzgga",
  "model": "stability-ai/sdxl",
  "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
  "input": {
    "input_images": "https://example.com/my-input-images.zip"
  },
  "logs": "",
  "error": null,
  "status": "starting",
  "created_at": "2023-09-08T16:32:56.990893084Z",
  "urls": {
    "web": "https://replicate.com/p/zz4ibbonubfz7carwiefibzgga",
     "get": "https://api.replicate.com/v1/predictions/zz4ibbonubfz7carwiefibzgga",
     "cancel": "https://api.replicate.com/v1/predictions/zz4ibbonubfz7carwiefibzgga/cancel"
  }
}
```

As models can take several minutes or more to train, the result will not be available immediately. To get the final result of the training you should either provide a `webhook` HTTPS URL for us to call when the results are ready, or poll the get a training endpoint until it has finished.

When a training completes, it creates a new version of the model at the specified destination.

To find some models to train on, check out the trainable language models collection.

### Request Body

* destinationstringRequired  
A string representing the desired model to push to in the format `{destination_model_owner}/{destination_model_name}`. This should be an existing model owned by the user or organization making the API request. If the destination is invalid, the server will return an appropriate 4XX response.
* inputobjectRequired  
An object containing inputs to the Cog model's `train()` function.
* webhookstring  
An HTTPS URL for receiving a webhook when the training completes. The webhook will be a POST request where the request body is the same as the response body of the get training operation. If there are network problems, we will retry the webhook a few times, so make sure it can be safely called more than once. Replicate will not follow redirects when sending webhook requests to your service, so be sure to specify a URL that will resolve without redirecting.
* webhook\_events\_filterarray  
By default, we will send requests to your webhook URL whenever there are new outputs or the training has finished. You can change which events trigger webhook requests by specifying `webhook_events_filter` in the training request:  
   * `start`: immediately on training start  
   * `output`: each time a training generates an output (note that trainings can generate multiple outputs)  
   * `logs`: each time log output is generated by a training  
   * `completed`: when the training reaches a terminal state (succeeded/canceled/failed)  
For example, if you only wanted requests to be sent at the start and end of the training, you would provide:  
```  
{  
  "destination": "my-organization/my-model",  
  "input": {  
    "text": "Alice"  
  },  
  "webhook": "https://example.com/my-webhook",  
  "webhook_events_filter": ["start", "completed"]  
}  
```  
Requests for event types `output` and `logs` will be sent at most once every 500ms. If you request `start` and `completed` webhooks, then they'll always be sent regardless of throttling.

## Get a training

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/trainings/{training_id}
```

### Description

Get the current state of a training.

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/trainings/zz4ibbonubfz7carwiefibzgga
```

Copy 

```
{
  "completed_at": "2023-09-08T16:41:19.826523Z",
  "created_at": "2023-09-08T16:32:57.018467Z",
  "error": null,
  "id": "zz4ibbonubfz7carwiefibzgga",
  "input": {
    "input_images": "https://example.com/my-input-images.zip"
  },
  "logs": "...",
  "metrics": {
    "predict_time": 502.713876
  },
  "output": {
    "version": "...",
    "weights": "..."
  },
  "started_at": "2023-09-08T16:32:57.112647Z",
  "status": "succeeded",
  "urls": {
    "web": "https://replicate.com/p/zz4ibbonubfz7carwiefibzgga",
    "get": "https://api.replicate.com/v1/trainings/zz4ibbonubfz7carwiefibzgga",
    "cancel": "https://api.replicate.com/v1/trainings/zz4ibbonubfz7carwiefibzgga/cancel"
  },
  "model": "stability-ai/sdxl",
  "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
}
```

* `starting`: the training is starting up. If this status lasts longer than a few seconds, then it’s typically because a new worker is being started to run the training.
* `processing`: the `train()` method of the model is currently running.
* `succeeded`: the training completed successfully.
* `failed`: the training encountered an error during processing.
* `canceled`: the training was canceled by its creator.

In the case of failure, `error` will contain the error encountered during the training.

Terminated trainings (with a status of `succeeded`, `failed`, or `canceled`) will include a `metrics` object with a `predict_time` property showing the amount of CPU or GPU time, in seconds, that the training used while running. It won’t include time waiting for the training to start.

* training\_idstringRequired  
The ID of the training to get.

## List trainings

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/trainings
```

### Description

Get a paginated list of all trainings created by the user or organization associated with the provided API token.

This will include trainings created from the API and the website. It will return 100 records per page.

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/trainings
```

The response will be a paginated JSON array of training objects, sorted with the most recent training first:

Copy 

```
{
  "next": null,
  "previous": null,
  "results": [
    {
      "completed_at": "2023-09-08T16:41:19.826523Z",
      "created_at": "2023-09-08T16:32:57.018467Z",
      "error": null,
      "id": "zz4ibbonubfz7carwiefibzgga",
      "input": {
        "input_images": "https://example.com/my-input-images.zip"
      },
      "metrics": {
        "predict_time": 502.713876
      },
      "output": {
        "version": "...",
        "weights": "..."
      },
      "started_at": "2023-09-08T16:32:57.112647Z",
      "source": "api",
      "status": "succeeded",
      "urls": {
        "web": "https://replicate.com/p/zz4ibbonubfz7carwiefibzgga",
        "get": "https://api.replicate.com/v1/trainings/zz4ibbonubfz7carwiefibzgga",
        "cancel": "https://api.replicate.com/v1/trainings/zz4ibbonubfz7carwiefibzgga/cancel"
      },
      "model": "stability-ai/sdxl",
      "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
    }
  ]
}
```

`id` will be the unique ID of the training.

`source` will indicate how the training was created. Possible values are `web` or `api`.

`status` will be the status of the training. Refer to get a single training for possible values.

`urls` will be a convenience object that can be used to construct new API requests for the given training.

`version` will be the unique ID of model version used to create the training.

## Cancel a training

### Endpoint

Copy 

```
POST https://api.replicate.com/v1/trainings/{training_id}/cancel
```

* training\_idstringRequired  
The ID of the training you want to cancel.

## List available hardware for models

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/hardware
```

### Description

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/hardware
```

The response will be a JSON array of hardware objects:

Copy 

```
[
    {"name": "CPU", "sku": "cpu"},
    {"name": "Nvidia T4 GPU", "sku": "gpu-t4"},
    {"name": "Nvidia A40 GPU", "sku": "gpu-a40-small"},
    {"name": "Nvidia A40 (Large) GPU", "sku": "gpu-a40-large"},
]
```

## Get the authenticated account

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/account
```

### Description

Returns information about the user or organization associated with the provided API token.

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/account
```

The response will be a JSON object describing the account:

Copy 

```
{
  "type": "organization",
  "username": "acme",
  "name": "Acme Corp, Inc.",
  "github_url": "https://github.com/acme",
}
```

## Get the signing secret for the default webhook

### Endpoint

Copy 

```
GET https://api.replicate.com/v1/webhooks/default/secret
```

### Description

Get the signing secret for the default webhook endpoint. This is used to verify that webhook requests are coming from Replicate.

Copy 

```
curl -s \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/webhooks/default/secret
```

The response will be a JSON object with a `key` property:

Copy 

```
{
  "key": "..."
}
```

## Rate limits

We limit the number of API requests that can be made to Replicate:

* You can call create prediction at 600 requests per minute.
* All other endpoints you can call at 3000 requests per minute.

If you hit a limit, you will receive a response with status `429` with a body like:

Copy 

```
{"detail":"Request was throttled. Expected available in 1 second."}
```

If you want higher limits, contact us.

## OpenAPI schema

Replicate’s public HTTP API documentation is available as a machine-readable OpenAPI schema in JSON format.

See OpenAPI schema to learn more and download the schema.

Next: OpenAPI schema