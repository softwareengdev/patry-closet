using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Cart.Commands;
using PatryCloset.Application.Features.Cart.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;
using PatryCloset.Domain.Interfaces;
using PatryCloset.UnitTests.Application.Helpers;
using CartEntity = PatryCloset.Domain.Entities.Cart;

namespace PatryCloset.UnitTests.Application.Features.Cart;

#region AddToCartCommandHandler

public class AddToCartCommandHandlerTests
{
    private readonly Mock<IRepository<CartEntity>> _cartRepo = new();
    private readonly Mock<IRepository<Product>> _productRepo = new();
    private readonly Mock<IRepository<ProductVariant>> _variantRepo = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<ILogger<AddToCartCommandHandler>> _logger = new();

    private readonly List<CartEntity> _carts = [];
    private readonly List<ProductVariant> _variants = [];
    private readonly Product _testProduct;
    private readonly ProductVariant _testVariant;
    private readonly AddToCartCommandHandler _sut;

    public AddToCartCommandHandlerTests()
    {
        _testProduct = CartTestHelpers.CreateTestProduct();
        _testVariant = CartTestHelpers.CreateTestVariant(_testProduct.Id);
        _variants.Add(_testVariant);
        _testProduct.Variants = new List<ProductVariant> { _testVariant };

        _cartRepo.Setup(r => r.AsQueryable()).Returns(() => _carts.BuildMockQueryable());
        _cartRepo.Setup(r => r.AddAsync(It.IsAny<CartEntity>(), It.IsAny<CancellationToken>()))
            .Callback<CartEntity, CancellationToken>((cart, _) => _carts.Add(cart))
            .ReturnsAsync((CartEntity cart, CancellationToken _) => cart);

        _variantRepo.Setup(r => r.AsQueryable()).Returns(() => _variants.BuildMockQueryable());

        _productRepo.Setup(r => r.GetByIdAsync(_testProduct.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testProduct);

        // After SaveChanges, fix up navigation properties for the mapper
        _unitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Callback(() =>
            {
                foreach (var cart in _carts)
                    foreach (var item in cart.Items)
                    {
                        item.Product ??= _testProduct;
                        item.ProductVariant ??= _testVariant;
                    }
            })
            .ReturnsAsync(1);

        _sut = new AddToCartCommandHandler(
            _cartRepo.Object, _productRepo.Object, _variantRepo.Object,
            _unitOfWork.Object, _logger.Object);
    }

    [Fact]
    public async Task Handle_WhenVariantNotFound_ReturnsFailure()
    {
        _variants.Clear();
        var command = new AddToCartCommand(null, "session-1", _testProduct.Id, "Rojo", "M");

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Variante");
    }

    [Fact]
    public async Task Handle_WhenStockInsufficient_ReturnsFailure()
    {
        _testVariant.StockQuantity = 1;
        var command = new AddToCartCommand(null, "session-1", _testProduct.Id, "Rojo", "M", 5);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Stock insuficiente");
    }

    [Fact]
    public async Task Handle_WhenProductNotFound_ReturnsFailure()
    {
        _productRepo.Setup(r => r.GetByIdAsync(_testProduct.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);
        var command = new AddToCartCommand(null, "session-1", _testProduct.Id, "Rojo", "M");

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Producto no encontrado");
    }

    [Fact]
    public async Task Handle_WhenProductInactive_ReturnsFailure()
    {
        _testProduct.IsActive = false;
        var command = new AddToCartCommand(null, "session-1", _testProduct.Id, "Rojo", "M");

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Producto no encontrado");
    }

    [Fact]
    public async Task Handle_WhenExistingItemExceedsMaxQuantity_ReturnsFailure()
    {
        var customerId = Guid.NewGuid();
        var existingCart = CartTestHelpers.CreateCartWithItem(customerId, _testProduct, _testVariant, quantity: 9);
        _carts.Add(existingCart);
        var command = new AddToCartCommand(customerId, null, _testProduct.Id, "Rojo", "M", 2);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Máximo 10 unidades");
    }

    [Fact]
    public async Task Handle_WhenExistingItemExceedsStock_ReturnsFailure()
    {
        _testVariant.StockQuantity = 5;
        var customerId = Guid.NewGuid();
        var existingCart = CartTestHelpers.CreateCartWithItem(customerId, _testProduct, _testVariant, quantity: 3);
        _carts.Add(existingCart);
        var command = new AddToCartCommand(customerId, null, _testProduct.Id, "Rojo", "M", 3);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Stock insuficiente");
    }

    [Fact]
    public async Task Handle_WhenNoCartExists_CreatesNewCartAndAddsItem()
    {
        var command = new AddToCartCommand(null, "new-session", _testProduct.Id, "Rojo", "M", 2);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _carts.Should().HaveCount(1);
        _carts[0].SessionId.Should().Be("new-session");
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenCartExists_UpdatesQuantityForSameVariant()
    {
        var customerId = Guid.NewGuid();
        var existingCart = CartTestHelpers.CreateCartWithItem(customerId, _testProduct, _testVariant, quantity: 2);
        _carts.Add(existingCart);
        var command = new AddToCartCommand(customerId, null, _testProduct.Id, "Rojo", "M", 3);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        existingCart.Items.First().Quantity.Should().Be(5);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenCartExists_AddsNewItemForDifferentVariant()
    {
        var customerId = Guid.NewGuid();
        var otherVariant = new ProductVariant
        {
            Id = Guid.NewGuid(), ProductId = _testProduct.Id,
            Color = "Azul", Size = "L", Sku = "TEST-AZUL-L",
            StockQuantity = 10, IsActive = true
        };
        _variants.Add(otherVariant);

        var existingCart = CartTestHelpers.CreateCartWithItem(customerId, _testProduct, _testVariant, quantity: 1);
        _carts.Add(existingCart);

        // Fix up: also set nav props for items with the new variant
        _unitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Callback(() =>
            {
                foreach (var cart in _carts)
                    foreach (var item in cart.Items)
                    {
                        item.Product ??= _testProduct;
                        if (item.ProductVariantId == _testVariant.Id)
                            item.ProductVariant ??= _testVariant;
                        else if (item.ProductVariantId == otherVariant.Id)
                            item.ProductVariant ??= otherVariant;
                    }
            })
            .ReturnsAsync(1);

        var command = new AddToCartCommand(customerId, null, _testProduct.Id, "Azul", "L", 2);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        existingCart.Items.Should().HaveCount(2);
    }
}

#endregion

#region UpdateCartItemCommandHandler

public class UpdateCartItemCommandHandlerTests
{
    private readonly Mock<IRepository<CartEntity>> _cartRepo = new();
    private readonly Mock<IRepository<CartItem>> _cartItemRepo = new();
    private readonly Mock<IRepository<ProductVariant>> _variantRepo = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private readonly List<CartEntity> _carts = [];
    private readonly Product _testProduct;
    private readonly ProductVariant _testVariant;
    private readonly UpdateCartItemCommandHandler _sut;

    public UpdateCartItemCommandHandlerTests()
    {
        _testProduct = CartTestHelpers.CreateTestProduct();
        _testVariant = CartTestHelpers.CreateTestVariant(_testProduct.Id);

        _cartRepo.Setup(r => r.AsQueryable()).Returns(() => _carts.BuildMockQueryable());

        _variantRepo.Setup(r => r.GetByIdAsync(_testVariant.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testVariant);

        _unitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _sut = new UpdateCartItemCommandHandler(
            _cartRepo.Object, _cartItemRepo.Object, _variantRepo.Object, _unitOfWork.Object);
    }

    [Fact]
    public async Task Handle_WhenCartNotFound_ReturnsFailure()
    {
        var command = new UpdateCartItemCommand(Guid.NewGuid(), Guid.NewGuid(), null, 3);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Carrito no encontrado");
    }

    [Fact]
    public async Task Handle_WhenItemNotFoundInCart_ReturnsFailure()
    {
        var customerId = Guid.NewGuid();
        _carts.Add(CartTestHelpers.CreateCartWithItem(customerId, _testProduct, _testVariant));
        var command = new UpdateCartItemCommand(Guid.NewGuid(), customerId, null, 3);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Artículo no encontrado");
    }

    [Fact]
    public async Task Handle_WhenStockInsufficient_ReturnsFailure()
    {
        _testVariant.StockQuantity = 2;
        var customerId = Guid.NewGuid();
        var cart = CartTestHelpers.CreateCartWithItem(customerId, _testProduct, _testVariant);
        _carts.Add(cart);
        var itemId = cart.Items.First().Id;
        var command = new UpdateCartItemCommand(itemId, customerId, null, 5);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Stock insuficiente");
    }

    [Fact]
    public async Task Handle_WhenValid_UpdatesQuantityAndSaves()
    {
        var customerId = Guid.NewGuid();
        var cart = CartTestHelpers.CreateCartWithItem(customerId, _testProduct, _testVariant, quantity: 1);
        _carts.Add(cart);
        var item = cart.Items.First();
        var command = new UpdateCartItemCommand(item.Id, customerId, null, 4);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        item.Quantity.Should().Be(4);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

#endregion

#region RemoveCartItemCommandHandler

public class RemoveCartItemCommandHandlerTests
{
    private readonly Mock<IRepository<CartEntity>> _cartRepo = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private readonly List<CartEntity> _carts = [];
    private readonly Product _testProduct;
    private readonly ProductVariant _testVariant;
    private readonly RemoveCartItemCommandHandler _sut;

    public RemoveCartItemCommandHandlerTests()
    {
        _testProduct = CartTestHelpers.CreateTestProduct();
        _testVariant = CartTestHelpers.CreateTestVariant(_testProduct.Id);

        _cartRepo.Setup(r => r.AsQueryable()).Returns(() => _carts.BuildMockQueryable());
        _unitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _sut = new RemoveCartItemCommandHandler(_cartRepo.Object, _unitOfWork.Object);
    }

    [Fact]
    public async Task Handle_WhenCartNotFound_ReturnsFailure()
    {
        var command = new RemoveCartItemCommand(Guid.NewGuid(), Guid.NewGuid(), null);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Carrito no encontrado");
    }

    [Fact]
    public async Task Handle_WhenItemNotFoundInCart_ReturnsFailure()
    {
        var customerId = Guid.NewGuid();
        _carts.Add(CartTestHelpers.CreateCartWithItem(customerId, _testProduct, _testVariant));
        var command = new RemoveCartItemCommand(Guid.NewGuid(), customerId, null);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Artículo no encontrado");
    }

    [Fact]
    public async Task Handle_WhenValid_RemovesItemAndSaves()
    {
        var customerId = Guid.NewGuid();
        var cart = CartTestHelpers.CreateCartWithItem(customerId, _testProduct, _testVariant);
        _carts.Add(cart);
        var itemId = cart.Items.First().Id;
        var command = new RemoveCartItemCommand(itemId, customerId, null);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        cart.Items.Should().BeEmpty();
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

#endregion

#region ClearCartCommandHandler

public class ClearCartCommandHandlerTests
{
    private readonly Mock<IRepository<CartEntity>> _cartRepo = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private readonly List<CartEntity> _carts = [];
    private readonly ClearCartCommandHandler _sut;

    public ClearCartCommandHandlerTests()
    {
        _cartRepo.Setup(r => r.AsQueryable()).Returns(() => _carts.BuildMockQueryable());
        _unitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _sut = new ClearCartCommandHandler(_cartRepo.Object, _unitOfWork.Object);
    }

    [Fact]
    public async Task Handle_WhenCartNotFound_ReturnsSuccess()
    {
        var command = new ClearCartCommand(Guid.NewGuid(), null);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenCartExists_ClearsAllItemsAndSaves()
    {
        var customerId = Guid.NewGuid();
        var product = CartTestHelpers.CreateTestProduct();
        var variant = CartTestHelpers.CreateTestVariant(product.Id);
        var cart = CartTestHelpers.CreateCartWithItem(customerId, product, variant);
        _carts.Add(cart);
        var command = new ClearCartCommand(customerId, null);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        cart.Items.Should().BeEmpty();
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

#endregion

#region Shared Helpers

internal static class CartTestHelpers
{
    internal static Product CreateTestProduct()
    {
        var id = Guid.NewGuid();
        var category = new Category
        {
            Id = Guid.NewGuid(), Name = "Camisetas", Slug = "camisetas"
        };
        return new Product
        {
            Id = id,
            Name = "Test Shirt",
            Slug = "test-shirt",
            Description = "A test shirt",
            Brand = "Test Brand",
            Price = 29.99m,
            IsActive = true,
            Badge = ProductBadge.None,
            Gender = Gender.Female,
            CategoryId = category.Id,
            Category = category,
            Images =
            [
                new ProductImage
                {
                    Id = Guid.NewGuid(), ProductId = id,
                    Url = "https://test.com/img1.jpg", SortOrder = 0
                }
            ],
            Variants = [],
        };
    }

    internal static ProductVariant CreateTestVariant(Guid productId) => new()
    {
        Id = Guid.NewGuid(),
        ProductId = productId,
        Color = "Rojo",
        Size = "M",
        Sku = "TEST-ROJO-M",
        StockQuantity = 20,
        IsActive = true,
    };

    internal static CartEntity CreateCartWithItem(
        Guid customerId, Product product, ProductVariant variant, int quantity = 2)
    {
        var cartId = Guid.NewGuid();
        return new CartEntity
        {
            Id = cartId,
            CustomerProfileId = customerId,
            Items = new List<CartItem>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    CartId = cartId,
                    ProductId = product.Id,
                    ProductVariantId = variant.Id,
                    Color = variant.Color,
                    Size = variant.Size,
                    UnitPrice = product.Price,
                    Quantity = quantity,
                    Product = product,
                    ProductVariant = variant,
                }
            }
        };
    }
}

#endregion
