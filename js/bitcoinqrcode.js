(function() {
	var app, App;

	App = function() {
		var self = this;

		this.pixels = 37;

		this.sizes = [
			this.pixels * 6,
			this.pixels * 3,
			this.pixels * 2,
		];

		this.overlays = [
			'pixel.png',
			'bitcoin-icon.png',
			'bitcoin-coin.png',
			'bitcoin-logo.png',
			'bitcoin-8bit.png',
			'litecoin-coin.png'
		];

		this.address = '';
		this.size    = 0;
		this.amount  = 0;

		$('#qrcodes').on('click', 'input', function() {
			$(this).select();
		});

		$('#address, #size, #amount').on('change blur keyup mouseup', function() {
			var parseBTC = function(num) {
				var answer;
				if ((num.slice(0,8) == '0.000000' || num.slice(0,7) == '.000000') && parseFloat(num) != 0) {
					answer = num.replace('0.000000', '').replace('.000000', '')
					answer = '0.000000' + answer
				} else {
					answer = parseFloat(num).toString()
				}
				while (answer.length - answer.indexOf('.') > 9) {answer = answer.slice(0,-1)}; 
				return answer;
			}

			var
				address = $('#address').val(),
				size = Math.min(600, Math.max(100, parseInt($('#size').val()))),
				amount = parseBTC($('#amount').val());

			if ( !address ) {
				address = $('#address').attr('placeholder');
			}

			if ( !size ) {
				size = parseInt($('#size').attr('placeholder'), 10);
			}

			if ( !amount ) {
				amount = parseBTC($('#amount').attr('placeholder'));
			}

			if ( ( address.length >= 27 && address.length <= 34 && address !== self.address ) || ( size && size !== self.size ) || ( amount && amount !== self.amount ) ) {
				$('#qrcode, #qrcodes').html('');

				self.address = address;
				self.size    = size;
				self.amount  = amount;

				self.update();
			}
		})
		.trigger('change');
	}

	App.prototype.update = function() {
		var
			self = this,
			amountstr,
			qrcode;

		if (this.amount == '0' || this.amount == 'NaN') {
			amountstr = ''
		} else {
			amountstr = '?amount=' + this.amount.toString()
		}
		$('#qrcode').qrcode({
			text: 'bitcoin:' + this.address + ((amountstr == '') ? '' : amountstr),
			width: this.pixels * 26,
			height: this.pixels * 26
		});

		qrcode = $('#qrcode canvas').get(0);

		$(self.overlays).each(function(i, overlay) {
			var
				canvas = $('<canvas>').get(0),
				context = canvas.getContext('2d'),
				size = Math.floor(self.size / self.pixels) * self.pixels
				offset = Math.floor(( self.size - size ) / 2);

			canvas.width  = self.size;
			canvas.height = self.size;

			context.imageSmoothingEnabled = false;
			context.mozImageSmoothingEnabled = false;
			context.webkitImageSmoothingEnabled = false;

			context.drawImage(qrcode, offset, offset, size, size);

			(function() {
				var image = new Image();

				image.src = 'img/' + overlay;

				$(image).on('load', function() {
					var wrap = $('<div>');

					context.drawImage(image, offset, offset, size, size);

					$(canvas)
						.on('click', function() {
							self.imgur(canvas);
						})
						.appendTo(wrap)
						.show()

					wrap.appendTo('#qrcodes');
				});
			}());
		});
	};

	App.prototype.imgur = function(canvas) {
		var
			image
			spinner = $('<div class="spinner">');

		spinner.appendTo($(canvas).parent());

		try {
			var image = canvas.toDataURL('image/png').split(',')[1];
		} catch(e) {
			var image = canvas.toDataURL().split(',')[1];
		}

		$.ajax({
			url: 'https://api.imgur.com/3/image',
			type: 'POST',
			headers: {
				'Authorization': 'Client-ID ' + IMGUR_CLIENT_ID
			},
			data: {
				type: 'base64',
				title: this.address,
				description: 'Via bitcoinqrcode.org',
				image: image
			},
			dataType: 'json'
		})
		.success(function(data) {
			spinner.hide();

			link = $('<div class="link"><input type="text" value="' + data.data.link + '"></div>');

			link.appendTo($(canvas).parent());
		})
		.error(function() {
			spinner.hide();

			alert('Sorry, the image could not be uploaded. We probably hit Imgur\'s upload limit.\n\nYou can still download the image and upload it yourself.');
		});
	}

	$(function() {
		app = new App();
	});
}());
